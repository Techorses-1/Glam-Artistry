const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    productId: {
        type: String,
        required: true,
        index: true,
    },
    variationId: {
        type: String,
        required: true,
        index: true,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
});

// Prevent duplicate: same user cannot add same product + same variation twice
wishlistSchema.index({ userId: 1, productId: 1, variationId: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);