const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const authUser = require("../middleware/authUser");
const mongoose = require("mongoose");

// ========== ADD TO CART ==========
// POST /cart/add
router.post("/add", authUser, async (req, res) => {
    try {
        const { productId, variationId, quantity = 1, designName } = req.body;

        if (!productId || !variationId || !designName) {
            return res.status(400).json({
                success: false,
                message: "Product ID, variation ID, and design name are required"
            });
        }

        // Check if product exists
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check if variation exists
        const variation = product.variations.find(v => v.variationId === variationId);
        if (!variation) {
            return res.status(404).json({
                success: false,
                message: "Variation not found"
            });
        }

        // Check inventory stock
        const inventory = await Inventory.findOne({ productId, variationId });
        if (inventory && inventory.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${inventory.stock} items available in stock`
            });
        }

        // Check if already in cart
        const existingItem = await Cart.findOne({
            userId: req.user.id,
            productId,
            variationId,
        });

        if (existingItem) {
            // Update quantity
            const newQuantity = existingItem.quantity + quantity;

            if (inventory && inventory.stock < newQuantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${inventory.stock} items available in stock`
                });
            }

            existingItem.quantity = newQuantity;
            await existingItem.save();

            return res.json({
                success: true,
                message: "Cart updated successfully",
                data: existingItem,
            });
        }

        // Add new item to cart
        const cartItem = await Cart.create({
            userId: req.user.id,
            productId,
            variationId,
            quantity,
            designName,
        });

        res.status(201).json({
            success: true,
            message: "Added to cart",
            data: cartItem,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Item already in cart"
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET USER'S CART (WITH FULL PRODUCT DETAILS) ==========
// GET /cart/get
router.get("/get", authUser, async (req, res) => {
    try {
        const cartItems = await Cart.find({ userId: req.user.id })
            .sort({ addedAt: -1 });

        if (cartItems.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: "Cart is empty",
                summary: {
                    totalItems: 0,
                    subtotal: 0,
                    totalSavings: 0
                }
            });
        }

        // Get product details for each cart item
        const cartWithDetails = await Promise.all(
            cartItems.map(async (item) => {
                const product = await Product.findOne({ productId: item.productId }).lean();

                if (!product) {
                    return null;
                }

                const variation = product.variations.find(
                    (v) => v.variationId === item.variationId
                );

                if (!variation) {
                    return null;
                }

                // Get inventory stock
                const inventory = await Inventory.findOne({
                    productId: item.productId,
                    variationId: item.variationId
                });

                const stock = inventory?.stock || 0;
                const isLowStock = stock <= 5 && stock > 0;
                const isOutOfStock = stock === 0;

                // Get variation image (first image)
                const variationImage = variation.images && variation.images.length > 0
                    ? variation.images[0]
                    : product.thumbnail;

                const itemTotal = variation.sellingPrice * item.quantity;
                const itemSavings = (variation.originalPrice - variation.sellingPrice) * item.quantity;

                return {
                    cartId: item._id,
                    productId: product.productId,
                    productName: product.name,
                    variationId: item.variationId,
                    designName: item.designName,
                    thumbnail: variationImage,
                    subCategory: product.subCategory,
                    mainCategory: product.mainCategory,
                    sellingPrice: variation.sellingPrice,
                    originalPrice: variation.originalPrice,
                    quantity: item.quantity,
                    itemTotal: itemTotal,
                    itemSavings: itemSavings,
                    stock: stock,
                    isLowStock: isLowStock,
                    isOutOfStock: isOutOfStock,
                    addedAt: item.addedAt,
                };
            })
        );

        // Filter out null values
        const validItems = cartWithDetails.filter(item => item !== null);

        // Calculate cart summary
        const summary = validItems.reduce((acc, item) => {
            acc.totalItems += item.quantity;
            acc.subtotal += item.itemTotal;
            acc.totalSavings += item.itemSavings;
            return acc;
        }, { totalItems: 0, subtotal: 0, totalSavings: 0 });

        res.json({
            success: true,
            data: validItems,
            count: validItems.length,
            summary: {
                totalItems: summary.totalItems,
                subtotal: summary.subtotal,
                totalSavings: summary.totalSavings,
                estimatedTotal: summary.subtotal,
                shipping: 0,
                tax: 0,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== UPDATE CART ITEM QUANTITY ==========
// PUT /cart/update/:productId/:variationId
router.put("/update/:productId/:variationId", authUser, async (req, res) => {
    try {
        const { productId, variationId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1"
            });
        }

        const cartItem = await Cart.findOne({
            userId: req.user.id,
            productId,
            variationId,
        });

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }

        // Check inventory stock
        const inventory = await Inventory.findOne({ productId, variationId });
        if (inventory && inventory.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${inventory.stock} items available in stock`
            });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        res.json({
            success: true,
            message: "Cart updated successfully",
            data: cartItem,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== REMOVE ITEM FROM CART ==========
// DELETE /cart/remove/:productId/:variationId
router.delete("/remove/:productId/:variationId", authUser, async (req, res) => {
    try {
        const { productId, variationId } = req.params;

        const result = await Cart.findOneAndDelete({
            userId: req.user.id,
            productId,
            variationId,
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }

        res.json({
            success: true,
            message: "Item removed from cart",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== CLEAR ENTIRE CART ==========
// DELETE /cart/clear
router.delete("/clear", authUser, async (req, res) => {
    try {
        await Cart.deleteMany({ userId: req.user.id });

        res.json({
            success: true,
            message: "Cart cleared successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET CART SUMMARY (for badge) ==========
// GET /cart/summary
router.get("/summary", authUser, async (req, res) => {
    try {
        const totalItems = await Cart.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
            { $group: { _id: null, total: { $sum: "$quantity" } } }
        ]);

        res.json({
            success: true,
            totalItems: totalItems[0]?.total || 0,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;