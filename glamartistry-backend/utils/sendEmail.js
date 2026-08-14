const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"Glam Artistry" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        throw new Error(`Email sending failed: ${error.message}`);
    }
};

module.exports = sendEmail;