const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const authUser = require("../middleware/authUser");
const sendEmail = require("../utils/sendEmail");

// ========== REGISTER ==========
// POST /users/register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email and password are required" });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone: phone || "",
        });

        const userData = user.toObject();
        delete userData.password;
        delete userData.resetPasswordToken;
        delete userData.resetPasswordExpires;

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: userData,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== LOGIN ==========
// POST /users/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        if (user.status !== "active") {
            return res.status(401).json({ success: false, message: "Account is inactive. Please contact support." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = jwt.sign(
            {
                id: user._id,
                userId: user.userId,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("userToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "None",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const userData = user.toObject();
        delete userData.password;
        delete userData.resetPasswordToken;
        delete userData.resetPasswordExpires;

        res.json({
            success: true,
            message: "Login successful",
            data: userData,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== LOGOUT ==========
// POST /users/logout
router.post("/logout", (req, res) => {
    res.clearCookie("userToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    res.json({ success: true, message: "Logged out successfully" });
});

// ========== GET PROFILE ==========
// GET /users/profile
router.get("/profile", authUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -resetPasswordToken -resetPasswordExpires");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== UPDATE PROFILE ==========
// PUT /users/profile
router.put("/profile", authUser, async (req, res) => {
    try {
        const { name, phone } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select("-password -resetPasswordToken -resetPasswordExpires");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: user,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== CHANGE PASSWORD ==========
// PUT /users/change-password
router.put("/change-password", authUser, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Current password and new password are required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});



// ========== FORGOT PASSWORD - SEND OTP ==========
// POST /users/forgot-password
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: "Email is required" 
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found with this email" 
            });
        }

        // Check if user is blocked
        if (user.isOtpBlocked()) {
            const remainingMinutes = Math.ceil((user.otpBlockedUntil - Date.now()) / 60000);
            return res.status(429).json({
                success: false,
                message: `Too many attempts. Please try again after ${remainingMinutes} minutes`
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set OTP expiry to 5 minutes from now
        const otpExpires = Date.now() + 5 * 60 * 1000;

        // Save OTP to user
        user.otp = otp;
        user.otpExpires = otpExpires;
        user.otpAttempts = 0; // Reset attempts on new OTP
        await user.save();

        // Send OTP via email
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2b2664; text-align: center;">Password Reset OTP</h2>
                <p>Hello ${user.name},</p>
                <p>You requested to reset your password. Use the OTP below to verify your identity:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 32px; font-weight: bold; color: #2b2664; letter-spacing: 5px; padding: 15px; background: #f5f5f5; border-radius: 8px; display: inline-block;">
                        ${otp}
                    </div>
                </div>
                <p>This OTP is valid for <strong>5 minutes</strong>.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <hr style="margin: 20px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">Glam Artistry - Turn every table into art</p>
            </div>
        `;

        await sendEmail(user.email, "Password Reset OTP - Glam Artistry", emailHtml);

        res.json({
            success: true,
            message: "OTP sent successfully to your email",
            email: user.email
        });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Failed to send OTP" 
        });
    }
});

// ========== VERIFY OTP ==========
// POST /users/verify-otp
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if blocked
        if (user.isOtpBlocked()) {
            const remainingMinutes = Math.ceil((user.otpBlockedUntil - Date.now()) / 60000);
            return res.status(429).json({
                success: false,
                message: `Too many failed attempts. Please try again after ${remainingMinutes} minutes`
            });
        }

        // Check if OTP exists
        if (!user.otp) {
            return res.status(400).json({
                success: false,
                message: "No OTP request found. Please request a new OTP"
            });
        }

        // Check if OTP expired
        if (user.isOtpExpired()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new OTP"
            });
        }

        // Verify OTP
        if (user.otp !== otp) {
            await user.incrementOtpAttempts();
            
            const remainingAttempts = 3 - user.otpAttempts;
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${remainingAttempts} attempts remaining`
            });
        }

        // OTP is correct - generate temporary token for password reset
        const resetToken = jwt.sign(
            { 
                id: user._id, 
                email: user.email,
                purpose: "password-reset"
            },
            process.env.JWT_SECRET,
            { expiresIn: "10m" } // Token valid for 10 minutes
        );

        // Clear OTP data (but keep for reference)
        user.otp = null;
        user.otpExpires = null;
        user.otpAttempts = 0;
        await user.save();

        res.json({
            success: true,
            message: "OTP verified successfully",
            resetToken: resetToken
        });

    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to verify OTP"
        });
    }
});

// ========== RESET PASSWORD (after OTP verification) ==========
// POST /users/reset-password
router.post("/reset-password", async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Reset token and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        // Verify the reset token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token. Please request a new OTP"
            });
        }

        // Check if token is for password reset purpose
        if (decoded.purpose !== "password-reset") {
            return res.status(400).json({
                success: false,
                message: "Invalid token purpose"
            });
        }

        // Find user
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password and clear any remaining reset data
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        user.otp = null;
        user.otpExpires = null;
        user.otpAttempts = 0;
        user.otpBlockedUntil = null;
        
        await user.save();

        res.json({
            success: true,
            message: "Password reset successfully! Please login with your new password"
        });

    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to reset password"
        });
    }
});

// ========== RESEND OTP ==========
// POST /users/resend-otp
router.post("/resend-otp", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if blocked
        if (user.isOtpBlocked()) {
            const remainingMinutes = Math.ceil((user.otpBlockedUntil - Date.now()) / 60000);
            return res.status(429).json({
                success: false,
                message: `Too many attempts. Please try again after ${remainingMinutes} minutes`
            });
        }

        // Generate new 6-digit OTP
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set OTP expiry to 5 minutes from now
        const otpExpires = Date.now() + 5 * 60 * 1000;

        // Update user
        user.otp = newOtp;
        user.otpExpires = otpExpires;
        user.otpAttempts = 0;
        await user.save();

        // Send new OTP via email
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2b2664; text-align: center;">New Password Reset OTP</h2>
                <p>Hello ${user.name},</p>
                <p>You requested a new OTP to reset your password. Use the OTP below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 32px; font-weight: bold; color: #2b2664; letter-spacing: 5px; padding: 15px; background: #f5f5f5; border-radius: 8px; display: inline-block;">
                        ${newOtp}
                    </div>
                </div>
                <p>This OTP is valid for <strong>5 minutes</strong>.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <hr style="margin: 20px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">Glam Artistry - Turn every table into art</p>
            </div>
        `;

        await sendEmail(user.email, "New Password Reset OTP - Glam Artistry", emailHtml);

        res.json({
            success: true,
            message: "New OTP sent successfully to your email"
        });

    } catch (error) {
        console.error("Resend OTP error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to resend OTP"
        });
    }
});




module.exports = router;