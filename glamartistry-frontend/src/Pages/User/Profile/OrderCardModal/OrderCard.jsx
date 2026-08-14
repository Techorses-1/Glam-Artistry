import React from "react";
import { FiEye, FiStar } from "react-icons/fi";

const OrderCard = ({ order, onViewOrder, onWriteReview }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatPrice = (price) => `₹${price?.toFixed(2) || "0.00"}`;

    const getStatusBadgeClass = (status) => {
        const classes = {
            pending: "oc__status--pending",
            confirmed: "oc__status--confirmed",
            processing: "oc__status--processing",
            shipped: "oc__status--shipped",
            delivered: "oc__status--delivered",
            cancelled: "oc__status--cancelled",
        };
        return classes[status] || "oc__status--pending";
    };

    const getStatusLabel = (status) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    // Check if order is delivered (can write review for first product)
    const canWriteReview = order.orderStatus === "delivered";

    // Get first product for quick review (or you can show review button per product in modal)
    const firstProduct = order.items?.[0];

    return (
        <div className="oc">
            <div className="oc__header">
                <div className="oc__order-id">
                    <span>Order ID:</span>
                    <strong>{order.orderId}</strong>
                </div>
                <div className="oc__date">{formatDate(order.orderDate)}</div>
            </div>

            <div className="oc__items-preview">
                {order.items?.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="oc__item-preview">
                        <img src={item.thumbnail} alt={item.productName} />
                        <div className="oc__item-info">
                            <p className="oc__item-name">{item.productName}</p>
                            <p className="oc__item-design">Design: {item.designName}</p>
                            <p className="oc__item-qty">Qty: {item.quantity}</p>
                        </div>
                    </div>
                ))}
                {order.items?.length > 2 && (
                    <div className="oc__more-items">
                        +{order.items.length - 2} more items
                    </div>
                )}
            </div>

            <div className="oc__footer">
                <div className="oc__total">
                    <span>Total:</span>
                    <strong>{formatPrice(order.total)}</strong>
                </div>
                <div className="oc__status">
                    <span className={`oc__status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
                        {getStatusLabel(order.orderStatus)}
                    </span>
                </div>
                <div className="oc__actions">
                    <button className="oc__view-btn" onClick={() => onViewOrder(order)}>
                        <FiEye /> View Details
                    </button>
                    {/* {canWriteReview && firstProduct && !firstProduct.hasReview && (
                        <button 
                            className="oc__review-btn" 
                            onClick={() => onWriteReview(order.orderId, firstProduct.productId, firstProduct.productName, firstProduct.variationId, firstProduct.designName)}
                        >
                            <FiStar /> Write Review
                        </button>
                    )} */}
                </div>
            </div>
        </div>
    );
};

export default OrderCard;