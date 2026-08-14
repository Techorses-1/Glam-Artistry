const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        default: () => `USR-${Date.now()}-${uuidv4().substr(0, 8)}`,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        default: "",
    },
    role: {
        type: String,
        enum: ["user"],
        default: "user",
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },

    // ========== FORGOT PASSWORD OTP FIELDS ==========
    otp: {
        type: String,
        default: null,
        trim: true,
    },
    otpExpires: {
        type: Date,
        default: null,
    },
    otpAttempts: {
        type: Number,
        default: 0,
    },
    otpBlockedUntil: {
        type: Date,
        default: null,
    },

    // ========== OLD TOKEN FIELDS (KEEP FOR BACKWARD COMPATIBILITY) ==========
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
    },

}, { timestamps: true });

// Method to check if OTP is expired
userSchema.methods.isOtpExpired = function () {
    return this.otpExpires ? Date.now() > this.otpExpires : true;
};

// Method to check if OTP is blocked
userSchema.methods.isOtpBlocked = function () {
    return this.otpBlockedUntil ? Date.now() < this.otpBlockedUntil : false;
};

// Method to clear OTP data after successful reset
userSchema.methods.clearOtpData = function () {
    this.otp = null;
    this.otpExpires = null;
    this.otpAttempts = 0;
    this.otpBlockedUntil = null;
};

// Method to increment OTP attempts
userSchema.methods.incrementOtpAttempts = async function () {
    this.otpAttempts += 1;

    // Block after 3 failed attempts for 15 minutes
    if (this.otpAttempts >= 3) {
        this.otpBlockedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
    }

    await this.save();
};

module.exports = mongoose.model("User", userSchema);