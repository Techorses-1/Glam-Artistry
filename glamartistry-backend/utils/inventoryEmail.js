const sendEmail = require("./sendEmail");

const sendLowStockAlert = async (inventory, product) => {
    try {
        const productName = product?.name || "Unknown Product";
        const variationName = inventory.variationName || "Unknown Variation";
        const currentStock = inventory.stock || 0;
        const threshold = inventory.lowStockThreshold || 10;

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2b2664; text-align: center;">⚠️ Low Stock Alert</h2>
                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <p><strong>Product Name:</strong> ${productName}</p>
                <p><strong>Variation:</strong> ${variationName}</p>
                <p><strong>Current Stock:</strong> <span style="color: #e53935; font-weight: bold;">${currentStock} units</span></p>
                <p><strong>Threshold:</strong> ${threshold} units</p>
                <p style="color: #e53935; font-weight: bold;">⚠️ Stock has fallen below the threshold! Please restock immediately.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 12px; color: #888; text-align: center;">Glam Artistry - Inventory Management System</p>
                <p style="font-size: 12px; color: #888; text-align: center;">This is an automated alert. Please do not reply.</p>
            </div>
        `;

        await sendEmail(
            process.env.ADMIN_EMAIL,
            `⚠️ Low Stock Alert: ${productName} - ${variationName}`,
            emailHtml
        );

        console.log(`Low stock alert sent for ${productName} - ${variationName}`);
    } catch (error) {
        console.error("Failed to send low stock alert email:", error);
    }
};

const sendStockUpdateNotification = async (inventory, product, oldStock, newStock, reason, changedBy) => {
    try {
        const productName = product?.name || "Unknown Product";
        const variationName = inventory.variationName || "Unknown Variation";

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2b2664; text-align: center;">📦 Stock Updated</h2>
                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <p><strong>Product Name:</strong> ${productName}</p>
                <p><strong>Variation:</strong> ${variationName}</p>
                <p><strong>Old Stock:</strong> ${oldStock} units</p>
                <p><strong>New Stock:</strong> ${newStock} units</p>
                <p><strong>Change:</strong> ${newStock - oldStock > 0 ? `+${newStock - oldStock}` : newStock - oldStock} units</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p><strong>Updated By:</strong> ${changedBy}</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 12px; color: #888; text-align: center;">Glam Artistry - Inventory Management System</p>
            </div>
        `;

        await sendEmail(
            process.env.ADMIN_EMAIL,
            `📦 Stock Updated: ${productName} - ${variationName}`,
            emailHtml
        );

        console.log(`Stock update notification sent for ${productName} - ${variationName}`);
    } catch (error) {
        console.error("Failed to send stock update email:", error);
    }
};

module.exports = {
    sendLowStockAlert,
    sendStockUpdateNotification,
};