const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const variationSchema = new mongoose.Schema({
    variationId: {
        type: String,
        unique: true,
        default: () => `VAR-${Date.now()}-${uuidv4().substr(0, 8)}`,
    },
    designName: {
        type: String,
        required: true,
        trim: true,
    },
    images: {
        type: [String],
        default: [],
    },
    sellingPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    originalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
});

const productSchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            unique: true,
            default: () => `PRD-${Date.now()}-${uuidv4().substr(0, 8)}`,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            required: true,
        },
        specifications: {
            type: Map,
            of: String,
            default: {},
        },
        thumbnail: {
            type: String,
            required: true,
        },
        mainCategory: {
            type: String,
            required: true,
        },
        subCategory: {
            type: String,
            required: true,
        },
        variations: [variationSchema],
    },
    { timestamps: true }
);

// Index for search optimization
productSchema.index({ name: "text" });

module.exports = mongoose.model("Product", productSchema);