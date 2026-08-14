const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true, // Always save in lowercase
    },
    type: {
        type: String,
        enum: ["main", "sub"],
        required: true,
    },
    image: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
}, { timestamps: true });

// Compound unique index: same name + same type cannot be duplicate
categorySchema.index({ name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);