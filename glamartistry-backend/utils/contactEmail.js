const sendEmail = require("./sendEmail");

// ─── ADMIN NOTIFICATION ───
const sendContactNotificationToAdmin = async (contact) => {
    try {
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2b2664; text-align: center;">📩 New Contact Message</h2>
                <hr style="border: none; border-top: 1px solid #e0e0e0;">

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; width: 130px;">Name:</td>
                        <td style="padding: 8px 0;">${contact.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                        <td style="padding: 8px 0;">
                            <a href="mailto:${contact.email}" style="color: #2b2664;">${contact.email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
                        <td style="padding: 8px 0;">
                            <a href="tel:${contact.phone}" style="color: #2b2664;">${contact.phone}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Subject:</td>
                        <td style="padding: 8px 0;">${contact.subject}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Submitted:</td>
                        <td style="padding: 8px 0;">${new Date(contact.createdAt).toLocaleString()}</td>
                    </tr>
                </table>

                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <h3 style="color: #2b2664;">Message:</h3>
                <p style="white-space: pre-wrap; line-height: 1.6; color: #333;">${contact.message}</p>

                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 12px; color: #888; text-align: center;">
                    Glam Artistry - Admin Notification
                </p>
            </div>
        `;

        await sendEmail(
            process.env.ADMIN_EMAIL,
            `New Contact - ${contact.subject}`,
            emailHtml
        );
        console.log(`Contact notification sent to admin`);
    } catch (error) {
        console.error("Failed to send contact notification to admin:", error);
    }
};

// ─── USER THANK-YOU EMAIL ───
const sendContactThankYouToUser = async (contact) => {
    try {
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2b2664; text-align: center;">Thank You for Contacting Us</h2>
                <hr style="border: none; border-top: 1px solid #e0e0e0;">

                <p>Dear ${contact.name},</p>
                <p>
                    Thank you for reaching out to <strong>Glam Artistry</strong>. We have
                    received your message and our team will get back to you as soon as
                    possible - usually within 24 hours.
                </p>

                <p><strong>Your Message Summary:</strong></p>
                <div style="background: #f8f8f8; padding: 14px 18px; border-radius: 8px; border-left: 3px solid #2b2664;">
                    <p style="margin: 0 0 8px;"><strong>Subject:</strong> ${contact.subject}</p>
                    <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; color: #333;">${contact.message}</p>
                </div>

                <p style="margin-top: 20px;">
                    If you need urgent assistance, feel free to call us at
                    <a href="tel:+919876543210" style="color: #2b2664;">+91 98765 43210</a>.
                </p>

                <p>Warm regards,<br><strong>Team Glam Artistry</strong></p>

                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 12px; color: #888; text-align: center;">
                    This is an automated confirmation - please do not reply to this email.
                </p>
            </div>
        `;

        await sendEmail(
            contact.email,
            `We Received Your Message - Glam Artistry`,
            emailHtml
        );
        console.log(`Thank-you email sent to ${contact.email}`);
    } catch (error) {
        console.error("Failed to send thank-you email to user:", error);
    }
};

module.exports = {
    sendContactNotificationToAdmin,
    sendContactThankYouToUser,
};