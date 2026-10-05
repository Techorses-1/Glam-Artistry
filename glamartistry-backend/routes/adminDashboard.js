const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const CancelledOrder = require("../models/CancelledOrder");
const User = require("../models/User");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const authAdmin = require("../middleware/authAdmin");

// Helper: get date range from query
// Accepts ?range=month or ?range=all (default = month)
const getDateRange = (range) => {
    if (range === "all") return null;

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of this month
    return { $gte: start, $lte: now };
};

// =============================================================
// 1. STATS — metric tiles
// GET /admin/dashboard/stats?range=month|all
// =============================================================
router.get("/stats", authAdmin, async (req, res) => {
    try {
        const { range = "month" } = req.query;
        const dateFilter = getDateRange(range);

        const orderQuery = dateFilter ? { orderDate: dateFilter } : {};
        const userQuery = dateFilter ? { createdAt: dateFilter } : {};

        const [
            totalRevenueAgg,
            totalOrders,
            pendingOrders,
            deliveredOrders,
            cancelledOrders,
            totalUsers,
            totalProducts,
            totalVariationsAgg,
        ] = await Promise.all([
            Order.aggregate([
                { $match: { ...orderQuery, orderStatus: { $ne: "cancelled" } } },
                { $group: { _id: null, total: { $sum: "$total" } } },
            ]),
            Order.countDocuments(orderQuery),
            Order.countDocuments({ ...orderQuery, orderStatus: "pending" }),
            Order.countDocuments({ ...orderQuery, orderStatus: "delivered" }),
            CancelledOrder.countDocuments(
                dateFilter ? { cancelledAt: dateFilter } : {}
            ),
            User.countDocuments(userQuery),
            Product.countDocuments({}),
            Product.aggregate([
                { $group: { _id: null, total: { $sum: { $size: "$variations" } } } },
            ]),
        ]);

        res.json({
            success: true,
            data: {
                totalRevenue: totalRevenueAgg[0]?.total || 0,
                totalOrders,
                pendingOrders,
                deliveredOrders,
                cancelledOrders,
                totalUsers,
                totalProducts,
                totalVariations: totalVariationsAgg[0]?.total || 0,
            },
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =============================================================
// 2. REVENUE CHART — monthly revenue + order count (last 12 months)
// GET /admin/dashboard/revenue-chart
// =============================================================
router.get("/revenue-chart", authAdmin, async (req, res) => {
    try {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const data = await Order.aggregate([
            {
                $match: {
                    orderDate: { $gte: twelveMonthsAgo },
                    orderStatus: { $ne: "cancelled" },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$orderDate" },
                        month: { $month: "$orderDate" },
                    },
                    revenue: { $sum: "$total" },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        // Build a full 12-month array (fill zeros for missing months)
        const months = [];
        const cursor = new Date(twelveMonthsAgo);
        for (let i = 0; i < 12; i++) {
            const year = cursor.getFullYear();
            const month = cursor.getMonth() + 1;

            const found = data.find(
                (d) => d._id.year === year && d._id.month === month
            );

            months.push({
                label: cursor.toLocaleString("en-IN", {
                    month: "short",
                    year: "2-digit",
                }),
                revenue: found ? Math.round(found.revenue) : 0,
                orders: found ? found.orders : 0,
            });

            cursor.setMonth(cursor.getMonth() + 1);
        }

        res.json({ success: true, data: months });
    } catch (error) {
        console.error("Revenue chart error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =============================================================
// 3. ORDERS BY STATUS — donut chart
// GET /admin/dashboard/orders-status?range=month|all
// =============================================================
router.get("/orders-status", authAdmin, async (req, res) => {
    try {
        const { range = "month" } = req.query;
        const dateFilter = getDateRange(range);
        const matchStage = dateFilter ? { orderDate: dateFilter } : {};

        const data = await Order.aggregate([
            { $match: matchStage },
            { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
        ]);

        const statusColors = {
            pending: "#f5a623",
            confirmed: "#4a90e2",
            processing: "#9b59b6",
            shipped: "#00bcd4",
            delivered: "#2AB453",
        };

        const allStatuses = ["pending", "confirmed", "processing", "shipped", "delivered"];

        const formatted = allStatuses.map((status) => {
            const found = data.find((d) => d._id === status);
            return {
                status,
                label: status.charAt(0).toUpperCase() + status.slice(1),
                count: found ? found.count : 0,
                color: statusColors[status],
            };
        });

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error("Orders status error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =============================================================
// 4. RECENT ORDERS — last 5
// GET /admin/dashboard/recent-orders
// =============================================================
router.get("/recent-orders", authAdmin, async (req, res) => {
    try {
        const orders = await Order.find({})
            .sort({ orderDate: -1 })
            .limit(5)
            .populate("userId", "name email")
            .select(
                "orderId orderStatus total orderDate shippingAddress.fullName userId"
            )
            .lean();

        res.json({ success: true, data: orders });
    } catch (error) {
        console.error("Recent orders error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =============================================================
// 5. LOW STOCK — variations where stock <= lowStockThreshold
// GET /admin/dashboard/low-stock
// =============================================================
router.get("/low-stock", authAdmin, async (req, res) => {
    try {
        const inventories = await Inventory.find({
            $expr: {
                $and: [
                    { $gt: ["$stock", 0] },
                    { $lte: ["$stock", "$lowStockThreshold"] },
                ],
            },
        })
            .sort({ stock: 1 })
            .limit(10)
            .lean();

        if (inventories.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const productIds = [...new Set(inventories.map((i) => i.productId))];
        const products = await Product.find({ productId: { $in: productIds } })
            .select("productId name thumbnail variations")
            .lean();

        const productMap = {};
        products.forEach((p) => {
            productMap[p.productId] = p;
        });

        const result = inventories.map((inv) => {
            const product = productMap[inv.productId];
            const variation = product?.variations?.find(
                (v) => v.variationId === inv.variationId
            );

            return {
                productId: inv.productId,
                productName: product?.name || "Unknown",
                thumbnail: product?.thumbnail || "",
                variationId: inv.variationId,
                designName: variation?.designName || "-",
                stock: inv.stock,
                lowStockThreshold: inv.lowStockThreshold,
            };
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error("Low stock error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =============================================================
// 6. TOP PRODUCTS — top 5 by quantity sold
// GET /admin/dashboard/top-products?range=month|all
// =============================================================
router.get("/top-products", authAdmin, async (req, res) => {
    try {
        const { range = "month" } = req.query;
        const dateFilter = getDateRange(range);
        const matchStage = dateFilter
            ? { orderDate: dateFilter, orderStatus: { $ne: "cancelled" } }
            : { orderStatus: { $ne: "cancelled" } };

        const data = await Order.aggregate([
            { $match: matchStage },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    productName: { $first: "$items.productName" },
                    thumbnail: { $first: "$items.thumbnail" },
                    subCategory: { $first: "$items.subCategory" },
                    totalQty: { $sum: "$items.quantity" },
                    totalRevenue: {
                        $sum: { $multiply: ["$items.sellingPrice", "$items.quantity"] },
                    },
                },
            },
            { $sort: { totalQty: -1 } },
            { $limit: 5 },
        ]);

        res.json({ success: true, data });
    } catch (error) {
        console.error("Top products error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;