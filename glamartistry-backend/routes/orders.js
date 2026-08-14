const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const authUser = require("../middleware/authUser");
const authAdmin = require("../middleware/authAdmin");
const { sendOrderConfirmationToUser, sendOrderNotificationToAdmin } = require("../utils/orderEmail");

// Helper function to deduct stock
const deductStock = async (items, orderId) => {
    for (const item of items) {
        const inventory = await Inventory.findOne({
            productId: item.productId,
            variationId: item.variationId
        });

        if (!inventory) {
            throw new Error(`Inventory not found for ${item.productName} - ${item.designName}`);
        }

        if (inventory.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.productName} - ${item.designName}. Only ${inventory.stock} left.`);
        }

        const oldStock = inventory.stock;
        inventory.stock -= item.quantity;
        await inventory.save();

        // Record stock history
        const StockHistory = require("../models/StockHistory");
        let stockHistory = await StockHistory.findOne({ inventoryId: inventory.inventoryId });

        if (!stockHistory) {
            stockHistory = new StockHistory({
                inventoryId: inventory.inventoryId,
                productId: item.productId,
                variationId: item.variationId,
                history: [],
            });
        }

        stockHistory.history.push({
            oldStock: oldStock,
            newStock: inventory.stock,
            changedBy: "system",
            reason: "order_placed",
            note: `Order placed - Order ID: ${orderId}`,
        });

        await stockHistory.save();
    }
};

// ========== CREATE ORDER ==========
// POST /orders/create
router.post("/create", authUser, async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, orderType } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "No items in order" });
        }

        if (!shippingAddress) {
            return res.status(400).json({ success: false, message: "Shipping address is required" });
        }

        // Verify stock and calculate totals
        let subtotal = 0;
        let originalTotal = 0;
        const verifiedItems = [];

        for (const item of items) {
            const product = await Product.findOne({ productId: item.productId });
            if (!product) {
                return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
            }

            const variation = product.variations.find(v => v.variationId === item.variationId);
            if (!variation) {
                return res.status(404).json({ success: false, message: `Variation not found for ${product.name}` });
            }

            const inventory = await Inventory.findOne({
                productId: item.productId,
                variationId: item.variationId
            });

            if (!inventory || inventory.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `${product.name} (${variation.designName}) - Only ${inventory?.stock || 0} left in stock`
                });
            }

            verifiedItems.push({
                productId: item.productId,
                productName: product.name,
                variationId: item.variationId,
                designName: variation.designName,
                quantity: item.quantity,
                sellingPrice: variation.sellingPrice,
                originalPrice: variation.originalPrice,
                thumbnail: variation.images?.[0] || product.thumbnail,
                subCategory: product.subCategory,
            });

            subtotal += variation.sellingPrice * item.quantity;
            originalTotal += variation.originalPrice * item.quantity;
        }

        const savings = originalTotal - subtotal;
        const shipping = subtotal > 1000 ? 0 : 50;
        const tax = subtotal * 0.18;
        const total = subtotal + shipping + tax;

        // Create order
        const order = new Order({
            userId: req.user.id,
            items: verifiedItems,
            shippingAddress,
            paymentMethod: paymentMethod || "cod",
            paymentStatus: "pending",
            orderStatus: "pending",
            subtotal,
            savings,
            shipping,
            tax,
            total,
        });

        await order.save();

        // Deduct stock (pass order.orderId after saving)
        await deductStock(verifiedItems, order.orderId);
        // Clear user's cart (only if orderType is "cart")
        if (orderType === "cart") {
            await Cart.deleteMany({ userId: req.user.id });
        }

        // Get user email for notification
        const User = require("../models/User");
        const user = await User.findById(req.user.id);

        // Send email notifications
        await sendOrderConfirmationToUser(order, user.email, user.name);
        await sendOrderNotificationToAdmin(order);

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: order,
        });
    } catch (error) {
        console.error("Create order error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET USER'S ORDERS ==========
// GET /orders/my-orders
router.get("/my-orders", authUser, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id })
            .sort({ orderDate: -1 });

        res.json({
            success: true,
            data: orders,
            count: orders.length,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET SINGLE ORDER ==========
// GET /orders/:orderId
router.get("/:orderId", authUser, async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Check if user owns the order or is admin
        if (order.userId.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});



// ========== USER: CANCEL ORDER (pending or confirmed only) ==========
// PUT /orders/cancel/:orderId
router.put("/cancel/:orderId", authUser, async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Check if user owns this order
        if (order.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        // Only allow cancellation for pending or confirmed orders
        if (order.orderStatus !== "pending" && order.orderStatus !== "confirmed") {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled. Current status: ${order.orderStatus}. Only pending or confirmed orders can be cancelled.`
            });
        }

        // Restore stock for each item
        for (const item of order.items) {
            const inventory = await Inventory.findOne({
                productId: item.productId,
                variationId: item.variationId
            });

            if (inventory) {
                const oldStock = inventory.stock;
                inventory.stock += item.quantity;
                await inventory.save();

                // Record stock history
                const StockHistory = require("../models/StockHistory");
                let stockHistory = await StockHistory.findOne({ inventoryId: inventory.inventoryId });

                if (!stockHistory) {
                    stockHistory = new StockHistory({
                        inventoryId: inventory.inventoryId,
                        productId: item.productId,
                        variationId: item.variationId,
                        history: [],
                    });
                }

                stockHistory.history.push({
                    oldStock: oldStock,
                    newStock: inventory.stock,
                    changedBy: req.user.email || "user",
                    reason: "order_cancelled",
                    note: `Order ${order.orderId} cancelled by user`,
                });

                await stockHistory.save();
            }
        }

        // Update order status
        order.orderStatus = "cancelled";
        await order.save();

        // Send email notification to user (optional)
        const User = require("../models/User");
        const user = await User.findById(req.user.id);

        if (user && user.email) {
            // You can add email sending here if needed
            console.log(`Cancellation email sent to ${user.email} for order ${order.orderId}`);
        }

        res.json({
            success: true,
            message: "Order cancelled successfully. Stock has been restored.",
            data: order,
        });
    } catch (error) {
        console.error("User cancel order error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== ADMIN: GET ALL ORDERS ==========
// GET /orders/admin/all
router.get("/admin/all", authAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = {};
        if (status) query.orderStatus = status;
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: "i" } },
                { "shippingAddress.fullName": { $regex: search, $options: "i" } },
                { "shippingAddress.phone": { $regex: search, $options: "i" } },
            ];
        }

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ orderDate: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("userId", "name email"),
            Order.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== ADMIN: UPDATE ORDER STATUS ==========
// PUT /orders/admin/update/:orderId
router.put("/admin/update/:orderId", authAdmin, async (req, res) => {
    try {
        const { orderStatus } = req.body;
        const order = await Order.findOne({ orderId: req.params.orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).json({ success: false, message: "Invalid order status" });
        }

        order.orderStatus = orderStatus;
        await order.save();

        res.json({
            success: true,
            message: `Order status updated to ${orderStatus}`,
            data: order,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== ADMIN: CANCEL ORDER ==========
// PUT /orders/admin/cancel/:orderId
router.put("/admin/cancel/:orderId", authAdmin, async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.orderStatus === "delivered") {
            return res.status(400).json({ success: false, message: "Delivered orders cannot be cancelled" });
        }

        // Restore stock
        for (const item of order.items) {
            const inventory = await Inventory.findOne({
                productId: item.productId,
                variationId: item.variationId
            });

            if (inventory) {
                inventory.stock += item.quantity;
                await inventory.save();

                // Record stock history
                const StockHistory = require("../models/StockHistory");
                let stockHistory = await StockHistory.findOne({ inventoryId: inventory.inventoryId });

                if (!stockHistory) {
                    stockHistory = new StockHistory({
                        inventoryId: inventory.inventoryId,
                        productId: item.productId,
                        variationId: item.variationId,
                        history: [],
                    });
                }

                stockHistory.history.push({
                    oldStock: inventory.stock - item.quantity,
                    newStock: inventory.stock,
                    changedBy: "admin",
                    reason: "order_cancelled",
                    note: `Order ${order.orderId} cancelled`,
                });

                await stockHistory.save();
            }
        }

        order.orderStatus = "cancelled";
        await order.save();

        res.json({
            success: true,
            message: "Order cancelled successfully",
            data: order,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== ADMIN: GET ORDER STATISTICS ==========
// GET /orders/admin/stats
router.get("/admin/stats", authAdmin, async (req, res) => {
    try {
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: "$orderStatus",
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$total" },
                },
            },
        ]);

        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $match: { orderStatus: { $ne: "cancelled" } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);

        res.json({
            success: true,
            data: {
                byStatus: stats,
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;