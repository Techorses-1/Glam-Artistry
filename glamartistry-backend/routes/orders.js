const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const CancelledOrder = require("../models/CancelledOrder");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const authUser = require("../middleware/authUser");
const authAdmin = require("../middleware/authAdmin");
const {
    sendOrderConfirmationToUser,
    sendOrderNotificationToAdmin,
    sendOrderStatusUpdateEmail,
} = require("../utils/orderEmail");

// Helper: deduct stock
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
            oldStock,
            newStock: inventory.stock,
            changedBy: "system",
            reason: "order_placed",
            note: `Order placed - Order ID: ${orderId}`,
        });

        await stockHistory.save();
    }
};

// Helper: restore stock
const restoreStock = async (items, orderId, changedBy) => {
    for (const item of items) {
        const inventory = await Inventory.findOne({
            productId: item.productId,
            variationId: item.variationId
        });

        if (inventory) {
            const oldStock = inventory.stock;
            inventory.stock += item.quantity;
            await inventory.save();

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
                oldStock,
                newStock: inventory.stock,
                changedBy,
                reason: "order_cancelled",
                note: `Order ${orderId} cancelled`,
            });

            await stockHistory.save();
        }
    }
};

// Helper: archive cancelled order and remove from active collection
const archiveCancelledOrder = async (order, changedBy, cancelReason = "") => {
    const archiveDoc = new CancelledOrder({
        orderId: order.orderId,
        userId: order.userId,
        items: order.items,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: "cancelled",
        subtotal: order.subtotal,
        savings: order.savings,
        shipping: order.shipping,
        tax: order.tax,
        total: order.total,
        orderDate: order.orderDate,
        cancelledAt: new Date(),
        cancelledBy: changedBy,
        cancelReason,
        originalCreatedAt: order.createdAt,
        originalUpdatedAt: order.updatedAt,
    });

    await archiveDoc.save();
    await Order.deleteOne({ _id: order._id });
};

// ========== CREATE ORDER ==========
router.post("/create", authUser, async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, orderType } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "No items in order" });
        }

        if (!shippingAddress) {
            return res.status(400).json({ success: false, message: "Shipping address is required" });
        }

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
        await deductStock(verifiedItems, order.orderId);

        if (orderType === "cart") {
            await Cart.deleteMany({ userId: req.user.id });
        }

        const User = require("../models/User");
        const user = await User.findById(req.user.id);

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
router.get("/my-orders", authUser, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.id }).sort({ orderDate: -1 });
        res.json({ success: true, data: orders, count: orders.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET SINGLE ORDER ==========
router.get("/:orderId", authUser, async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.userId.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== USER: CANCEL ORDER ==========
router.put("/cancel/:orderId", authUser, async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        if (order.orderStatus !== "pending" && order.orderStatus !== "confirmed") {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled. Current status: ${order.orderStatus}. Only pending or confirmed orders can be cancelled.`
            });
        }

        await restoreStock(order.items, order.orderId, req.user.email || "user");
        await archiveCancelledOrder(order, req.user.email || "user", "Cancelled by user");

        const User = require("../models/User");
        const user = await User.findById(req.user.id);
        if (user?.email) {
            console.log(`Cancellation logged for ${user.email} for order ${order.orderId}`);
        }

        res.json({
            success: true,
            message: "Order cancelled successfully. Stock has been restored and order archived.",
        });
    } catch (error) {
        console.error("User cancel order error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== ADMIN: GET ALL ORDERS ==========
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
            Order.find(query).sort({ orderDate: -1 }).skip(skip).limit(parseInt(limit)).populate("userId", "name email"),
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

// ========== ADMIN: GET CANCELLED ORDERS (ARCHIVE) ==========
router.get("/admin/cancelled", authAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = {};
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: "i" } },
                { "shippingAddress.fullName": { $regex: search, $options: "i" } },
                { "shippingAddress.phone": { $regex: search, $options: "i" } },
            ];
        }

        const [orders, total] = await Promise.all([
            CancelledOrder.find(query).sort({ cancelledAt: -1 }).skip(skip).limit(parseInt(limit)).populate("userId", "name email"),
            CancelledOrder.countDocuments(query),
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

// ========== ADMIN: UPDATE ORDER STATUS (sends email on confirmed/processing/shipped/delivered) ==========
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

        const previousStatus = order.orderStatus;
        order.orderStatus = orderStatus;

        // Auto-mark payment as paid when delivered
        if (orderStatus === "delivered" && order.paymentStatus !== "paid") {
            order.paymentStatus = "paid";
        }

        await order.save();

        // Send email only if status actually changed and it's one we notify on
        if (previousStatus !== orderStatus) {
            const User = require("../models/User");
            const user = await User.findById(order.userId);

            if (user?.email && ["confirmed", "processing", "shipped", "delivered"].includes(orderStatus)) {
                try {
                    await sendOrderStatusUpdateEmail(order, user.email, user.name, orderStatus);
                } catch (emailErr) {
                    console.error("Status email error:", emailErr);
                }
            }
        }

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
router.put("/admin/cancel/:orderId", authAdmin, async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.orderStatus === "delivered") {
            return res.status(400).json({ success: false, message: "Delivered orders cannot be cancelled" });
        }

        await restoreStock(order.items, order.orderId, "admin");
        await archiveCancelledOrder(order, req.admin?.email || "admin", "Cancelled by admin");

        res.json({
            success: true,
            message: "Order cancelled successfully. Stock restored and order archived.",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== ADMIN: GET ORDER STATISTICS ==========
router.get("/admin/stats", authAdmin, async (req, res) => {
    try {
        const stats = await Order.aggregate([
            { $group: { _id: "$orderStatus", count: { $sum: 1 }, totalRevenue: { $sum: "$total" } } },
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