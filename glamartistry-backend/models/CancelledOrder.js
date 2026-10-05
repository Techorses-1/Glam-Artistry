const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    variationId: { type: String, required: true },
    designName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    sellingPrice: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    thumbnail: { type: String, required: true },
    subCategory: { type: String, required: true },
});

const shippingAddressSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String, default: "" },
});

const cancelledOrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, index: true },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: { type: String, enum: ["cod", "online"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    orderStatus: { type: String, default: "cancelled" },
    subtotal: { type: Number, required: true },
    savings: { type: Number, default: 0 },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    orderDate: { type: Date, required: true },

    cancelledAt: { type: Date, default: Date.now },
    cancelledBy: { type: String, default: "system" },
    cancelReason: { type: String, default: "" },
    originalCreatedAt: { type: Date },
    originalUpdatedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("CancelledOrder", cancelledOrderSchema);