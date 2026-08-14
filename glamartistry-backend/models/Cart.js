const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
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
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
    },
    designName: {
        type: String,
        required: true,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

// Prevent duplicate: same user cannot add same product + same variation twice
cartSchema.index({ userId: 1, productId: 1, variationId: 1 }, { unique: true });

module.exports = mongoose.model("Cart", cartSchema);