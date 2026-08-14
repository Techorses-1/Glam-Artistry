const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Order = require("../models/Order");
const authUser = require("../middleware/authUser");
const authAdmin = require("../middleware/authAdmin");

// ========== CREATE REVIEW ==========
// POST /reviews/create
router.post("/create", authUser, async (req, res) => {
    console.log("=========================================");
    console.log("🔥 CREATE REVIEW API CALLED");
    console.log("=========================================");
    
    try {
        const { orderId, productId, variationId, rating, comment } = req.body;

        console.log("📦 Request Body:", JSON.stringify(req.body, null, 2));
        console.log("👤 User ID from token:", req.user?.id);
        console.log("👤 User Email from token:", req.user?.email);

        // Validation
        if (!orderId || !productId || !variationId) {
            console.log("❌ Validation Failed: Missing required fields");
            console.log("   - orderId:", orderId);
            console.log("   - productId:", productId);
            console.log("   - variationId:", variationId);
            
            return res.status(400).json({
                success: false,
                message: "Order ID, Product ID, and Variation ID are required"
            });
        }

        if (!rating || rating < 1 || rating > 5) {
            console.log("❌ Validation Failed: Invalid rating:", rating);
            
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        if (!comment || comment.trim().length === 0) {
            console.log("❌ Validation Failed: Comment is empty");
            
            return res.status(400).json({
                success: false,
                message: "Comment is required"
            });
        }

        if (comment.length > 1000) {
            console.log("❌ Validation Failed: Comment too long:", comment.length);
            
            return res.status(400).json({
                success: false,
                message: "Comment cannot exceed 1000 characters"
            });
        }

        console.log("✅ Validation passed");
        console.log("📝 Rating:", rating);
        console.log("📝 Comment length:", comment.length);

        // Check if order exists and belongs to user
        console.log("🔍 Looking for order with orderId:", orderId);
        
        const order = await Order.findOne({ orderId: orderId });
        
        if (!order) {
            console.log("❌ Order not found for orderId:", orderId);
            
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }
        
        console.log("✅ Order found!");
        console.log("   - Order ID:", order.orderId);
        console.log("   - Order Status:", order.orderStatus);
        console.log("   - Order User ID:", order.userId.toString());
        console.log("   - Logged-in User ID:", req.user.id);
        console.log("   - User Match:", order.userId.toString() === req.user.id);

        // Check if user owns this order
        if (order.userId.toString() !== req.user.id) {
            console.log("❌ Unauthorized: User does not own this order");
            
            return res.status(403).json({
                success: false,
                message: "Unauthorized - You can only review your own orders"
            });
        }

        // Check if order is delivered (can only review delivered orders)
        if (order.orderStatus !== "delivered") {
            console.log("❌ Order not delivered. Current status:", order.orderStatus);
            
            return res.status(400).json({
                success: false,
                message: "You can only review products from delivered orders"
            });
        }

        // Check if product exists in this order
        console.log("🔍 Looking for product in order items:");
        console.log("   - Product ID:", productId);
        console.log("   - Variation ID:", variationId);
        
        const orderItem = order.items.find(
            item => item.productId === productId && item.variationId === variationId
        );

        if (!orderItem) {
            console.log("❌ Product not found in order items");
            console.log("   Available items:", order.items.map(i => ({ productId: i.productId, variationId: i.variationId })));
            
            return res.status(404).json({
                success: false,
                message: "Product not found in this order"
            });
        }
        
        console.log("✅ Product found in order!");
        console.log("   - Product Name:", orderItem.productName);
        console.log("   - Design Name:", orderItem.designName);

        // Check if review already exists for this product/variation from this user
        console.log("🔍 Checking for existing review...");
        
        const existingReview = await Review.findOne({
            userId: req.user.id,
            productId: productId,
            variationId: variationId
        });

        if (existingReview) {
            console.log("❌ Review already exists!");
            console.log("   - Existing Review ID:", existingReview.reviewId);
            console.log("   - Existing Rating:", existingReview.rating);
            
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this product"
            });
        }

        // Create review
        console.log("📝 Creating new review...");
        
        const review = new Review({
            userId: req.user.id,
            orderId: orderId,
            productId: productId,
            variationId: variationId,
            productName: orderItem.productName,
            designName: orderItem.designName,
            rating: rating,
            comment: comment.trim(),
        });

        await review.save();
        
        console.log("✅ Review created successfully!");
        console.log("   - Review ID:", review.reviewId);
        console.log("   - Product:", review.productName);
        console.log("   - Rating:", review.rating);
        console.log("=========================================\n");

        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            data: review
        });

    } catch (error) {
        console.error("❌ CREATE REVIEW ERROR:", error);
        console.error("   - Error Name:", error.name);
        console.error("   - Error Message:", error.message);
        console.error("   - Error Stack:", error.stack);
        console.log("=========================================\n");
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ========== GET MY REVIEWS (for logged-in user) ==========
// GET /reviews/my-reviews
router.get("/my-reviews", authUser, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [reviews, total] = await Promise.all([
            Review.find({ userId: req.user.id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Review.countDocuments({ userId: req.user.id })
        ]);

        res.json({
            success: true,
            data: reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                limit: parseInt(limit),
            }
        });

    } catch (error) {
        console.error("Get my reviews error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ========== GET REVIEWS FOR A PRODUCT (with variation) ==========
// GET /reviews/product/:productId/:variationId
router.get("/product/:productId/:variationId", async (req, res) => {
    try {
        const { productId, variationId } = req.params;
        const { page = 1, limit = 10, sort = "newest" } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        let sortObj = {};
        switch (sort) {
            case "newest":
                sortObj = { createdAt: -1 };
                break;
            case "oldest":
                sortObj = { createdAt: 1 };
                break;
            case "highest":
                sortObj = { rating: -1 };
                break;
            case "lowest":
                sortObj = { rating: 1 };
                break;
            default:
                sortObj = { createdAt: -1 };
        }

        const [reviews, total] = await Promise.all([
            Review.find({ productId, variationId })
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .populate("userId", "name"),
            Review.countDocuments({ productId, variationId })
        ]);

        // Calculate average rating
        const ratingAggregation = await Review.aggregate([
            { $match: { productId, variationId } },
            { $group: { _id: null, averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
        ]);

        const averageRating = ratingAggregation[0]?.averageRating || 0;
        const totalReviews = ratingAggregation[0]?.totalReviews || 0;

        res.json({
            success: true,
            data: reviews,
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalReviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                limit: parseInt(limit),
            }
        });

    } catch (error) {
        console.error("Get product reviews error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ========== UPDATE REVIEW ==========
// PUT /reviews/update/:reviewId
router.put("/update/:reviewId", authUser, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;

        // Find review
        const review = await Review.findOne({ reviewId: reviewId });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Check if user owns this review
        if (review.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized - You can only edit your own reviews"
            });
        }

        // Validation
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        if (comment && comment.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot exceed 1000 characters"
            });
        }

        // Update review
        if (rating) review.rating = rating;
        if (comment) review.comment = comment.trim();
        review.isEdited = true;
        review.updatedAt = Date.now();

        await review.save();

        res.json({
            success: true,
            message: "Review updated successfully",
            data: review
        });

    } catch (error) {
        console.error("Update review error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ========== DELETE REVIEW ==========
// DELETE /reviews/delete/:reviewId
router.delete("/delete/:reviewId", authUser, async (req, res) => {
    try {
        const { reviewId } = req.params;

        // Find review
        const review = await Review.findOne({ reviewId: reviewId });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Check if user owns this review
        if (review.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized - You can only delete your own reviews"
            });
        }

        await Review.deleteOne({ reviewId: reviewId });

        res.json({
            success: true,
            message: "Review deleted successfully"
        });

    } catch (error) {
        console.error("Delete review error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ========== CHECK IF USER HAS REVIEWED PRODUCT ==========
// GET /reviews/check/:productId/:variationId
router.get("/check/:productId/:variationId", authUser, async (req, res) => {
    try {
        const { productId, variationId } = req.params;

        const review = await Review.findOne({
            userId: req.user.id,
            productId: productId,
            variationId: variationId
        });

        res.json({
            success: true,
            hasReviewed: !!review,
            review: review || null
        });

    } catch (error) {
        console.error("Check review error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ========== ADMIN: GET ALL REVIEWS ==========
// GET /reviews/admin/all
router.get("/admin/all", authAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [reviews, total] = await Promise.all([
            Review.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("userId", "name email"),
            Review.countDocuments()
        ]);

        res.json({
            success: true,
            data: reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                limit: parseInt(limit),
            }
        });

    } catch (error) {
        console.error("Admin get all reviews error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ========== ADMIN: DELETE ANY REVIEW ==========
// DELETE /reviews/admin/delete/:reviewId
router.delete("/admin/delete/:reviewId", authAdmin, async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findOne({ reviewId: reviewId });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        await Review.deleteOne({ reviewId: reviewId });

        res.json({
            success: true,
            message: "Review deleted by admin"
        });

    } catch (error) {
        console.error("Admin delete review error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// TEST ROUTE - Add at the very top
router.get("/test", (req, res) => {
    res.json({ success: true, message: "Reviews API is working!" });
});

console.log("✅ Review routes loaded successfully");


module.exports = router;