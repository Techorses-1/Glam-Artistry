const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const {
    sendContactNotificationToAdmin,
    sendContactThankYouToUser,
} = require("../utils/contactEmail");

// ========== SUBMIT CONTACT FORM (PUBLIC) ==========
// POST /contact/send
router.post("/send", async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Basic validation
        if (!name || !email || !phone || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Simple email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }

        // Basic length guards
        if (name.length > 50 || subject.length > 100 || message.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "One or more fields exceed the allowed length",
            });
        }

        // Capture IP for spam tracking
        const ipAddress =
            req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.socket?.remoteAddress ||
            "";

        // Save to DB
        const contact = await Contact.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            subject: subject.trim(),
            message: message.trim(),
            ipAddress,
        });

        // Send emails (non-blocking — don't fail the request if email fails)
        await Promise.allSettled([
            sendContactNotificationToAdmin(contact),
            sendContactThankYouToUser(contact),
        ]);

        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: {
                contactId: contact._id,
            },
        });
    } catch (error) {
        console.error("Contact send error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;