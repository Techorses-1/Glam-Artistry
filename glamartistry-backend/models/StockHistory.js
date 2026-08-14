const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const stockHistoryEntrySchema = new mongoose.Schema({
    historyId: {
        type: String,
        default: () => `HIST-${Date.now()}-${uuidv4().substr(0, 8)}`,
    },
    oldStock: {
        type: Number,
        required: true,
    },
    newStock: {
        type: Number,
        required: true,
    },
    changedBy: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        enum: ["admin_update", "order_placed", "order_cancelled", "stock_reset", "return"],
        required: true,
    },
    note: {
        type: String,
        default: "",
    },
}, { timestamps: true });

const stockHistorySchema = new mongoose.Schema({
    inventoryId: {
        type: String,
        required: true,
        unique: true,
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
    history: [stockHistoryEntrySchema],
}, { timestamps: true });

module.exports = mongoose.model("StockHistory", stockHistorySchema);