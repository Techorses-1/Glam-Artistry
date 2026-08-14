const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const StockHistory = require("../models/StockHistory");
const Product = require("../models/Product");
const authAdmin = require("../middleware/authAdmin");
const { sendLowStockAlert, sendStockUpdateNotification } = require("../utils/inventoryEmail");

// ========== GET ALL INVENTORY ==========
// GET /inventory/get-all
router.get("/get-all", authAdmin, async (req, res) => {
    try {
        const inventory = await Inventory.find().sort({ createdAt: -1 });

        const inventoryWithProducts = await Promise.all(
            inventory.map(async (item) => {
                const product = await Product.findOne({ productId: item.productId });
                // Find variation to get designName
                const variation = product?.variations?.find(v => v.variationId === item.variationId);
                return {
                    ...item.toObject(),
                    productName: product?.name || "Unknown",
                    productThumbnail: product?.thumbnail || "",
                    designName: variation?.designName || "Unknown",
                };
            })
        );

        res.json({
            success: true,
            data: inventoryWithProducts,
            count: inventoryWithProducts.length,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// ========== PUBLIC: GET VARIATION STOCK STATUS ==========
// GET /inventory/status/:productId/:variationId
router.get("/status/:productId/:variationId", async (req, res) => {
    try {
        const { productId, variationId } = req.params;
        
        const inventory = await Inventory.findOne({ productId, variationId });

        if (!inventory) {
            // If no inventory exists, return default
            return res.json({
                success: true,
                data: {
                    productId,
                    variationId,
                    stock: 0,
                    lowStockThreshold: 10,
                    status: "no-inventory",
                    inStock: false,
                }
            });
        }

        let status = "in-stock";
        if (inventory.stock === 0) {
            status = "out-of-stock";
        } else if (inventory.stock <= inventory.lowStockThreshold) {
            status = "low-stock";
        }

        res.json({
            success: true,
            data: {
                productId: inventory.productId,
                variationId: inventory.variationId,
                stock: inventory.stock,
                lowStockThreshold: inventory.lowStockThreshold,
                status,
                inStock: inventory.stock > 0,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET INVENTORY BY PRODUCT ID ==========
// GET /inventory/get/:productId
router.get("/get/:productId", authAdmin, async (req, res) => {
    try {
        const { productId } = req.params;
        const inventory = await Inventory.find({ productId });

        if (!inventory || inventory.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No inventory found for this product"
            });
        }

        // Get product to fetch variation design names
        const product = await Product.findOne({ productId });
        const inventoryWithDesignNames = inventory.map(item => {
            const variation = product?.variations?.find(v => v.variationId === item.variationId);
            return {
                ...item.toObject(),
                designName: variation?.designName || "Unknown",
            };
        });

        res.json({ success: true, data: inventoryWithDesignNames });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET SPECIFIC VARIATION STOCK ==========
// GET /inventory/get-variation/:productId/:variationId
router.get("/get-variation/:productId/:variationId", authAdmin, async (req, res) => {
    try {
        const { productId, variationId } = req.params;
        const inventory = await Inventory.findOne({ productId, variationId });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found for this variation"
            });
        }

        // Get product to fetch variation design name
        const product = await Product.findOne({ productId });
        const variation = product?.variations?.find(v => v.variationId === variationId);

        res.json({
            success: true,
            data: {
                ...inventory.toObject(),
                designName: variation?.designName || "Unknown",
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== UPDATE STOCK (ADD/REMOVE/SET) ==========
// PUT /inventory/update
router.put("/update", authAdmin, async (req, res) => {
    try {
        const { inventoryId, quantity, newStock, reason, note } = req.body;
        const changedBy = req.admin?.email || "admin";

        if (!inventoryId) {
            return res.status(400).json({
                success: false,
                message: "inventoryId is required"
            });
        }

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Reason is required"
            });
        }

        // Find inventory
        const inventory = await Inventory.findOne({ inventoryId });
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        const oldStock = inventory.stock;
        let newStockValue = oldStock;

        // Calculate new stock
        if (newStock !== undefined) {
            newStockValue = newStock;
        } else if (quantity !== undefined) {
            newStockValue = oldStock + quantity;
        } else {
            return res.status(400).json({
                success: false,
                message: "Either quantity or newStock is required"
            });
        }

        // Validate stock cannot be negative
        if (newStockValue < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock cannot be negative"
            });
        }

        // Update stock
        inventory.stock = newStockValue;
        inventory.lastUpdatedBy = changedBy;
        await inventory.save();

        // Get product and variation for email
        const product = await Product.findOne({ productId: inventory.productId });
        const variation = product?.variations?.find(v => v.variationId === inventory.variationId);

        // Find or create stock history document
        let stockHistory = await StockHistory.findOne({ inventoryId });

        if (!stockHistory) {
            stockHistory = new StockHistory({
                inventoryId,
                productId: inventory.productId,
                variationId: inventory.variationId,
                history: [],
            });
        }

        // Add history entry
        stockHistory.history.push({
            oldStock,
            newStock: newStockValue,
            changedBy,
            reason,
            note: note || "",
        });

        await stockHistory.save();

        // Prepare inventory object for email with designName
        const inventoryForEmail = {
            ...inventory.toObject(),
            variationName: variation?.designName || "Unknown",
        };

        // Send email notification for stock update
        await sendStockUpdateNotification(inventoryForEmail, product, oldStock, newStockValue, reason, changedBy);

        // Check low stock and send alert
        if (newStockValue <= inventory.lowStockThreshold) {
            await sendLowStockAlert(inventoryForEmail, product);
        }

        res.json({
            success: true,
            message: "Stock updated successfully",
            data: {
                inventory,
                oldStock,
                newStock: newStockValue,
                change: newStockValue - oldStock,
                designName: variation?.designName || "Unknown",
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== BULK UPDATE INVENTORY ==========
// POST /inventory/bulk-update
router.post("/bulk-update", authAdmin, async (req, res) => {
    try {
        const { updates } = req.body;
        const changedBy = req.admin?.email || "admin";

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Updates array is required"
            });
        }

        const results = [];

        for (const update of updates) {
            const { inventoryId, quantity, newStock, reason, note } = update;

            if (!inventoryId || !reason) {
                results.push({ inventoryId, success: false, message: "inventoryId and reason required" });
                continue;
            }

            const inventory = await Inventory.findOne({ inventoryId });
            if (!inventory) {
                results.push({ inventoryId, success: false, message: "Inventory not found" });
                continue;
            }

            const oldStock = inventory.stock;
            let newStockValue = oldStock;

            if (newStock !== undefined) {
                newStockValue = newStock;
            } else if (quantity !== undefined) {
                newStockValue = oldStock + quantity;
            } else {
                results.push({ inventoryId, success: false, message: "quantity or newStock required" });
                continue;
            }

            if (newStockValue < 0) {
                results.push({ inventoryId, success: false, message: "Stock cannot be negative" });
                continue;
            }

            inventory.stock = newStockValue;
            inventory.lastUpdatedBy = changedBy;
            await inventory.save();

            const product = await Product.findOne({ productId: inventory.productId });
            const variation = product?.variations?.find(v => v.variationId === inventory.variationId);

            let stockHistory = await StockHistory.findOne({ inventoryId });
            if (!stockHistory) {
                stockHistory = new StockHistory({
                    inventoryId,
                    productId: inventory.productId,
                    variationId: inventory.variationId,
                    history: [],
                });
            }

            stockHistory.history.push({
                oldStock,
                newStock: newStockValue,
                changedBy,
                reason,
                note: note || "",
            });

            await stockHistory.save();

            if (newStockValue <= inventory.lowStockThreshold) {
                const inventoryForEmail = {
                    ...inventory.toObject(),
                    variationName: variation?.designName || "Unknown",
                };
                await sendLowStockAlert(inventoryForEmail, product);
            }

            results.push({
                inventoryId,
                success: true,
                oldStock,
                newStock: newStockValue,
                change: newStockValue - oldStock,
                designName: variation?.designName || "Unknown",
            });
        }

        res.json({
            success: true,
            message: "Bulk update completed",
            results,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET LOW STOCK ITEMS ==========
// GET /inventory/low-stock
router.get("/low-stock", authAdmin, async (req, res) => {
    try {
        const inventory = await Inventory.find({
            $expr: {
                $lte: ["$stock", "$lowStockThreshold"]
            }
        }).sort({ stock: 1 });

        const lowStockItems = await Promise.all(
            inventory.map(async (item) => {
                const product = await Product.findOne({ productId: item.productId });
                const variation = product?.variations?.find(v => v.variationId === item.variationId);
                return {
                    ...item.toObject(),
                    productName: product?.name || "Unknown",
                    productThumbnail: product?.thumbnail || "",
                    designName: variation?.designName || "Unknown",
                };
            })
        );

        res.json({
            success: true,
            data: lowStockItems,
            count: lowStockItems.length,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET STOCK HISTORY BY INVENTORY ID ==========
// GET /inventory/history/:inventoryId
router.get("/history/:inventoryId", authAdmin, async (req, res) => {
    try {
        const { inventoryId } = req.params;
        const stockHistory = await StockHistory.findOne({ inventoryId });

        if (!stockHistory) {
            return res.status(404).json({
                success: false,
                message: "No history found for this inventory"
            });
        }

        // Get product and variation for additional info
        const product = await Product.findOne({ productId: stockHistory.productId });
        const variation = product?.variations?.find(v => v.variationId === stockHistory.variationId);

        res.json({
            success: true,
            data: {
                ...stockHistory.toObject(),
                productName: product?.name || "Unknown",
                designName: variation?.designName || "Unknown",
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET STOCK HISTORY BY PRODUCT ID ==========
// GET /inventory/history/product/:productId
router.get("/history/product/:productId", authAdmin, async (req, res) => {
    try {
        const { productId } = req.params;
        const stockHistory = await StockHistory.find({ productId });

        if (!stockHistory || stockHistory.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No history found for this product"
            });
        }

        // Get product details
        const product = await Product.findOne({ productId });

        // Add design names to each history item
        const historyWithDetails = await Promise.all(
            stockHistory.map(async (history) => {
                const variation = product?.variations?.find(v => v.variationId === history.variationId);
                return {
                    ...history.toObject(),
                    productName: product?.name || "Unknown",
                    designName: variation?.designName || "Unknown",
                };
            })
        );

        res.json({
            success: true,
            data: historyWithDetails,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== INITIALIZE INVENTORY FOR NEW PRODUCT ==========
// POST /inventory/initialize/:productId
router.post("/initialize/:productId", authAdmin, async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findOne({ productId });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const existingInventory = await Inventory.find({ productId });
        if (existingInventory.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Inventory already exists for this product"
            });
        }

        const inventoryItems = [];

        for (const variation of product.variations) {
            const inventory = new Inventory({
                productId,
                variationId: variation.variationId,
                stock: 0,
                lowStockThreshold: 10,
                lastUpdatedBy: req.admin?.email || "system",
            });
            await inventory.save();
            inventoryItems.push({
                ...inventory.toObject(),
                designName: variation.designName,
            });
        }

        res.json({
            success: true,
            message: `Initialized ${inventoryItems.length} inventory items for product`,
            data: inventoryItems,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;