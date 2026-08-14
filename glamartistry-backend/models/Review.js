const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    reviewId: {
        type: String,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    orderId: {
        type: String,
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
    productName: {
        type: String,
        required: true,
    },
    designName: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    isEdited: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

// Generate reviewId before saving
reviewSchema.pre("save", async function () {
    if (this.reviewId) return;

    const ReviewCounter = require("./ReviewCounter");
    let counter = await ReviewCounter.findOne({ name: "review" });

    if (!counter) {
        counter = new ReviewCounter({ name: "review", sequence: 0 });
    }

    counter.sequence += 1;
    await counter.save();

    this.reviewId = `rev-${Date.now()}-${counter.sequence}`;
});

// Update updatedAt on edit
reviewSchema.pre("findOneAndUpdate", function () {
    this.set({ updatedAt: Date.now(), isEdited: true });
});

module.exports = mongoose.model("Review", reviewSchema);