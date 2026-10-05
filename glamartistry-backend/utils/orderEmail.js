const sendEmail = require("./sendEmail");

const sendOrderConfirmationToUser = async (order, userEmail, userName) => {
    try {
        const itemsList = order.items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName} (${item.designName})</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.sellingPrice.toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.sellingPrice * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2b2664; text-align: center;">Order Confirmation</h2>
                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <p>Dear ${userName},</p>
                <p>Thank you for your order! Your order has been placed successfully.</p>
                <p><strong>Order ID:</strong> ${order.orderId}</p>
                <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
                
                <h3>Order Items:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 8px; text-align: left;">Product</th>
                            <th style="padding: 8px; text-align: center;">Qty</th>
                            <th style="padding: 8px; text-align: right;">Price</th>
                            <th style="padding: 8px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsList}
                    </tbody>
                </table>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <div style="text-align: right;">
                    <p><strong>Subtotal:</strong> ₹${order.subtotal.toFixed(2)}</p>
                    ${order.savings > 0 ? `<p><strong>Savings:</strong> -₹${order.savings.toFixed(2)}</p>` : ''}
                    <p><strong>Shipping:</strong> ${order.shipping === 0 ? "Free" : `₹${order.shipping.toFixed(2)}`}</p>
                    <p><strong>Tax (GST 18%):</strong> ₹${order.tax.toFixed(2)}</p>
                    <h3><strong>Total:</strong> ₹${order.total.toFixed(2)}</h3>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <p><strong>Shipping Address:</strong></p>
                <p>
                    ${order.shippingAddress.fullName}<br>
                    ${order.shippingAddress.addressLine1}<br>
                    ${order.shippingAddress.addressLine2 ? `${order.shippingAddress.addressLine2}<br>` : ''}
                    ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
                    Phone: ${order.shippingAddress.phone}
                </p>
                
                <p><strong>Payment Method:</strong> ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</p>
                <p><strong>Order Status:</strong> ${order.orderStatus}</p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 12px; color: #888; text-align: center;">Glam Artistry - Thank you for shopping with us!</p>
            </div>
        `;

        await sendEmail(userEmail, `Order Confirmed - ${order.orderId}`, emailHtml);
        console.log(`Order confirmation email sent to ${userEmail}`);
    } catch (error) {
        console.error("Failed to send order confirmation email:", error);
    }
};

const sendOrderNotificationToAdmin = async (order) => {
    try {
        const itemsList = order.items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName} (${item.designName})</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.sellingPrice * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2b2664; text-align: center;">🛒 New Order Received</h2>
                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <p><strong>Order ID:</strong> ${order.orderId}</p>
                <p><strong>Customer:</strong> ${order.shippingAddress.fullName}</p>
                <p><strong>Phone:</strong> ${order.shippingAddress.phone}</p>
                <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                
                <h3>Order Items:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 8px; text-align: left;">Product</th>
                            <th style="padding: 8px; text-align: center;">Qty</th>
                            <th style="padding: 8px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsList}
                    </tbody>
                </table>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <div style="text-align: right;">
                    <p><strong>Subtotal:</strong> ₹${order.subtotal.toFixed(2)}</p>
                    <p><strong>Shipping:</strong> ${order.shipping === 0 ? "Free" : `₹${order.shipping.toFixed(2)}`}</p>
                    <p><strong>Tax:</strong> ₹${order.tax.toFixed(2)}</p>
                    <h3><strong>Total:</strong> ₹${order.total.toFixed(2)}</h3>
                </div>
                
                <p><strong>Payment Method:</strong> ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 12px; color: #888; text-align: center;">Glam Artistry - Admin Notification</p>
            </div>
        `;

        await sendEmail(process.env.ADMIN_EMAIL, `New Order - ${order.orderId}`, emailHtml);
        console.log(`Admin notification sent for order ${order.orderId}`);
    } catch (error) {
        console.error("Failed to send admin notification:", error);
    }
};

// ─── STATUS UPDATE EMAIL ───
// For "delivered" → full detail email (items, totals, shipping address, payment method)
// For "confirmed" / "processing" / "shipped" → short email (orderId, status, total only)
const sendOrderStatusUpdateEmail = async (order, userEmail, userName, newStatus) => {
    try {
        // ─────────────────────────────────────────────────
        // DELIVERED — FULL DETAIL EMAIL
        // ─────────────────────────────────────────────────
        if (newStatus === "delivered") {
            const itemsList = order.items.map(item => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName} (${item.designName})</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.sellingPrice.toFixed(2)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.sellingPrice * item.quantity).toFixed(2)}</td>
                </tr>
            `).join('');

            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #2AB453; text-align: center;">Order Delivered</h2>
                    <hr style="border: none; border-top: 1px solid #e0e0e0;">
                    <p>Dear ${userName},</p>
                    <p>Great news — your order has been delivered. We hope you love it!</p>
                    <p><strong>Order ID:</strong> ${order.orderId}</p>
                    <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
                    
                    <h3>Order Items:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="padding: 8px; text-align: left;">Product</th>
                                <th style="padding: 8px; text-align: center;">Qty</th>
                                <th style="padding: 8px; text-align: right;">Price</th>
                                <th style="padding: 8px; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsList}
                        </tbody>
                    </table>
                    
                    <hr style="border: none; border-top: 1px solid #e0e0e0;">
                    <div style="text-align: right;">
                        <p><strong>Subtotal:</strong> ₹${order.subtotal.toFixed(2)}</p>
                        ${order.savings > 0 ? `<p><strong>Savings:</strong> -₹${order.savings.toFixed(2)}</p>` : ''}
                        <p><strong>Shipping:</strong> ${order.shipping === 0 ? "Free" : `₹${order.shipping.toFixed(2)}`}</p>
                        <p><strong>Tax (GST 18%):</strong> ₹${order.tax.toFixed(2)}</p>
                        <h3><strong>Total:</strong> ₹${order.total.toFixed(2)}</h3>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e0e0e0;">
                    <p><strong>Shipping Address:</strong></p>
                    <p>
                        ${order.shippingAddress.fullName}<br>
                        ${order.shippingAddress.addressLine1}<br>
                        ${order.shippingAddress.addressLine2 ? `${order.shippingAddress.addressLine2}<br>` : ''}
                        ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
                        Phone: ${order.shippingAddress.phone}
                    </p>
                    
                    <p><strong>Payment Method:</strong> ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</p>
                    <p><strong>Order Status:</strong> <span style="color: #2AB453; font-weight: bold; text-transform: uppercase;">DELIVERED</span></p>
                    
                    <hr style="border: none; border-top: 1px solid #e0e0e0;">
                    <p style="font-size: 12px; color: #888; text-align: center;">Glam Artistry - Thank you for shopping with us!</p>
                </div>
            `;

            await sendEmail(userEmail, `Order ${order.orderId} - Delivered`, emailHtml);
            console.log(`Delivered email sent to ${userEmail} for order ${order.orderId}`);
            return;
        }

        // ─────────────────────────────────────────────────
        // CONFIRMED / PROCESSING / SHIPPED — SHORT EMAIL
        // ─────────────────────────────────────────────────
        const statusMessages = {
            confirmed: "Your order has been confirmed and is being prepared.",
            processing: "Your order is being processed and packed.",
            shipped: "Your order has been shipped and is on the way.",
        };

        const message = statusMessages[newStatus] || `Your order status has been updated to ${newStatus}.`;

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2b2664; text-align: center;">Order Status Update</h2>
                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <p>Dear ${userName},</p>
                <p>${message}</p>
                <p><strong>Order ID:</strong> ${order.orderId}</p>
                <p><strong>New Status:</strong> <span style="color: #2b2664; font-weight: bold; text-transform: uppercase;">${newStatus}</span></p>
                <p><strong>Total:</strong> ₹${order.total.toFixed(2)}</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 12px; color: #888; text-align: center;">Glam Artistry - Thank you for shopping with us!</p>
            </div>
        `;

        await sendEmail(userEmail, `Order ${order.orderId} - Status Updated to ${newStatus}`, emailHtml);
        console.log(`Status update email sent to ${userEmail} for order ${order.orderId}`);
    } catch (error) {
        console.error("Failed to send status update email:", error);
    }
};

module.exports = {
    sendOrderConfirmationToUser,
    sendOrderNotificationToAdmin,
    sendOrderStatusUpdateEmail,
};