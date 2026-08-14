const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const inventorySchema = new mongoose.Schema({
    inventoryId: {
        type: String,
        unique: true,
        default: () => `INV-${Date.now()}-${uuidv4().substr(0, 8)}`,
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
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
    lowStockThreshold: {
        type: Number,
        default: 10,
    },
    lastUpdatedBy: {
        type: String,
        default: "system",
    },
}, { timestamps: true });

// Compound unique index to prevent duplicate entries for same product+variation
inventorySchema.index({ productId: 1, variationId: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);