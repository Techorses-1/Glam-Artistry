const express = require("express");
const router = express.Router();
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const authUser = require("../middleware/authUser");
const mongoose = require("mongoose");

// ========== ADD TO WISHLIST ==========
// POST /wishlist/add
router.post("/add", authUser, async (req, res) => {
    try {
        console.log("========== ADD TO WISHLIST ==========");
        console.log("Request body:", req.body);
        console.log("User from auth:", req.user);

        const { productId, variationId } = req.body;

        if (!productId || !variationId) {
            console.log("❌ Missing productId or variationId");
            return res.status(400).json({
                success: false,
                message: "Product ID and variation ID are required"
            });
        }

        console.log(`Looking for product with productId: ${productId}`);

        // Check if product exists
        const product = await Product.findOne({ productId });
        if (!product) {
            console.log(`❌ Product not found: ${productId}`);
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        console.log(`✅ Product found: ${product.name}`);

        console.log(`Looking for variation with variationId: ${variationId}`);
        console.log(`Available variations: ${product.variations.map(v => v.variationId).join(', ')}`);

        // Check if variation with this ID exists
        const variation = product.variations.find(v => v.variationId === variationId);
        if (!variation) {
            console.log(`❌ Variation not found: ${variationId}`);
            return res.status(404).json({
                success: false,
                message: "Variation not found"
            });
        }
        console.log(`✅ Variation found: ${variation.designName}`);

        console.log(`Checking existing wishlist for userId: ${req.user.id}, productId: ${productId}, variationId: ${variationId}`);

        // Check if already in wishlist
        const existing = await Wishlist.findOne({
            userId: req.user.id,
            productId,
            variationId,
        });

        if (existing) {
            console.log("❌ Item already in wishlist");
            return res.status(400).json({
                success: false,
                message: "Item already in wishlist"
            });
        }

        console.log("✅ Adding to wishlist...");

        // Add to wishlist
        const wishlistItem = await Wishlist.create({
            userId: req.user.id,
            productId,
            variationId,
        });

        console.log(`✅ Wishlist item created: ${wishlistItem._id}`);
        console.log("========== ADD TO WISHLIST COMPLETE ==========");

        res.status(201).json({
            success: true,
            message: "Added to wishlist",
            data: wishlistItem,
        });
    } catch (error) {
        console.error("❌ ERROR in add to wishlist:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== REMOVE FROM WISHLIST ==========
// DELETE /wishlist/remove/:productId/:variationId
router.delete("/remove/:productId/:variationId", authUser, async (req, res) => {
    try {
        const { productId, variationId } = req.params;

        const result = await Wishlist.findOneAndDelete({
            userId: req.user.id,
            productId,
            variationId,
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Item not found in wishlist"
            });
        }

        res.json({
            success: true,
            message: "Removed from wishlist",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET USER'S WISHLIST (WITH FULL PRODUCT DETAILS) ==========
// GET /wishlist/get
router.get("/get", authUser, async (req, res) => {
    try {
        // Get all wishlist items for this user
        const wishlistItems = await Wishlist.find({
            userId: req.user.id
        }).sort({ addedAt: -1 });

        if (wishlistItems.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: "Wishlist is empty",
                count: 0,
            });
        }

        // Get product details for each wishlist item
        const wishlistWithProducts = await Promise.all(
            wishlistItems.map(async (item) => {
                const product = await Product.findOne({ productId: item.productId }).lean();

                if (!product) {
                    return null;
                }

                // Find the specific variation by variationId
                const variation = product.variations.find(
                    (v) => v.variationId === item.variationId
                );

                if (!variation) {
                    return null;
                }

                return {
                    wishlistId: item._id,
                    productId: product.productId,
                    productName: product.name,
                    variationId: item.variationId,
                    designName: variation.designName,
                    thumbnail: product.thumbnail,   // always product thumbnail
                    subCategory: product.subCategory,
                    mainCategory: product.mainCategory,
                    sellingPrice: variation.sellingPrice,
                    originalPrice: variation.originalPrice,
                    addedAt: item.addedAt,
                };
            })
        );

        // Filter out null values (where product or variation not found)
        const validItems = wishlistWithProducts.filter(item => item !== null);

        res.json({
            success: true,
            data: validItems,
            count: validItems.length,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== CHECK IF PRODUCT VARIATION IS IN WISHLIST ==========
// GET /wishlist/check/:productId/:variationId
router.get("/check/:productId/:variationId", authUser, async (req, res) => {
    try {
        const { productId, variationId } = req.params;

        const exists = await Wishlist.findOne({
            userId: req.user.id,
            productId,
            variationId,
        });

        res.json({
            success: true,
            inWishlist: !!exists,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== REMOVE MULTIPLE ITEMS FROM WISHLIST ==========
// POST /wishlist/remove-multiple
router.post("/remove-multiple", authUser, async (req, res) => {
    try {
        const { items } = req.body; // items = [{ productId, variationId }]

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Items array is required"
            });
        }

        let deletedCount = 0;

        for (const item of items) {
            const result = await Wishlist.findOneAndDelete({
                userId: req.user.id,
                productId: item.productId,
                variationId: item.variationId,
            });
            if (result) deletedCount++;
        }

        res.json({
            success: true,
            message: `${deletedCount} item(s) removed from wishlist`,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;