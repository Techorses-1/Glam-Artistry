const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    addressLine1: {
        type: String,
        required: true,
        trim: true,
    },
    addressLine2: {
        type: String,
        default: "",
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    state: {
        type: String,
        required: true,
        trim: true,
    },
    pincode: {
        type: String,
        required: true,
        trim: true,
    },
    landmark: {
        type: String,
        default: "",
        trim: true,
    },
    addressType: {
        type: String,
        enum: ["home", "office", "other"],
        default: "home",
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// ✅ FIXED: Remove 'next' parameter from async function
addressSchema.pre("save", async function () {
    if (this.isDefault) {
        await this.constructor.updateMany(
            { userId: this.userId, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    // No need to call next() - async function handles it automatically
});

module.exports = mongoose.model("Address", addressSchema);