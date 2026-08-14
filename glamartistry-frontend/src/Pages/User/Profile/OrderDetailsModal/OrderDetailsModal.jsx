import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiTruck, FiPackage, FiClock, FiMapPin, FiUser, FiPhone, FiStar } from "react-icons/fi";
import { toast } from "react-toastify";
import EditReviewModal from "../ReviewModal/EditReviewModal";

const OrderDetailsModal = ({ order, onClose, onWriteReview, onCancelOrder }) => {
    const [cancelling, setCancelling] = useState(false);
    const [reviews, setReviews] = useState({});
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedReviewItem, setSelectedReviewItem] = useState(null);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const formatPrice = (price) => `₹${price?.toFixed(2) || "0.00"}`;

    const statusSteps = [
        { key: "pending", label: "Pending", icon: <FiClock /> },
        { key: "confirmed", label: "Confirmed", icon: <FiCheck /> },
        { key: "processing", label: "Processing", icon: <FiPackage /> },
        { key: "shipped", label: "Shipped", icon: <FiTruck /> },
        { key: "delivered", label: "Delivered", icon: <FiCheck /> },
    ];

    const getCurrentStepIndex = () => {
        const statuses = ["pending", "confirmed", "processing", "shipped", "delivered"];
        return statuses.indexOf(order.orderStatus);
    };

    const currentStepIndex = getCurrentStepIndex();
    const isDelivered = order.orderStatus === "delivered";
    const canCancel = order.orderStatus === "pending" || order.orderStatus === "confirmed";

    // ========== ADD THE MISSING FUNCTION HERE ==========
    const handleCancelOrder = async () => {
        const confirm = window.confirm("Are you sure you want to cancel this order? This action cannot be undone.");
        if (!confirm) return;

        setCancelling(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/cancel/${order.orderId}`, {
                method: "PUT",
                credentials: "include",
            });
            const data = await response.json();

            if (data.success) {
                toast.success("Order cancelled successfully");
                onCancelOrder(); // Refresh orders list
                onClose(); // Close modal
            } else {
                toast.error(data.message || "Failed to cancel order");
            }
        } catch (error) {
            toast.error("Failed to cancel order");
        } finally {
            setCancelling(false);
        }
    };
    // ========== END OF ADDED FUNCTION ==========

    // Fetch review status for each item
    const fetchReviewsForItems = async () => {
        const reviewMap = {};
        for (const item of order.items) {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/reviews/check/${item.productId}/${item.variationId}`,
                    { credentials: "include" }
                );
                const data = await response.json();
                if (data.success && data.hasReviewed) {
                    reviewMap[`${item.productId}-${item.variationId}`] = data.review;
                }
            } catch (error) {
                console.error("Failed to fetch review status:", error);
            }
        }
        setReviews(reviewMap);
    };

    useEffect(() => {
        if (isDelivered) {
            fetchReviewsForItems();
        }
    }, [isDelivered]);

    const handleReviewClick = (item) => {
        const reviewKey = `${item.productId}-${item.variationId}`;
        const existingReview = reviews[reviewKey];

        if (existingReview) {
            setSelectedReviewItem({
                ...item,
                review: existingReview
            });
            setReviewModalOpen(true);
        } else {
            onWriteReview(order.orderId, item.productId, item.variationId, item.productName, item.designName);
        }
    };

    const handleReviewUpdate = (updatedReview) => {
        const reviewKey = `${updatedReview.productId}-${updatedReview.variationId}`;
        setReviews(prev => ({
            ...prev,
            [reviewKey]: updatedReview
        }));
        toast.success("Review updated!");
    };

    const handleReviewDelete = (reviewId) => {
        const newReviews = { ...reviews };
        for (const key in newReviews) {
            if (newReviews[key].reviewId === reviewId) {
                delete newReviews[key];
                break;
            }
        }
        setReviews(newReviews);
        toast.success("Review deleted!");
    };

    const renderStarRating = (rating) => {
        return (
            <div className="odm__review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                        key={star}
                        className={star <= rating ? "odm__star--filled" : "odm__star--empty"}
                    />
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="odm__overlay" onClick={onClose}>
                <div className="odm__modal" onClick={(e) => e.stopPropagation()}>
                    <div className="odm__header">
                        <h2>Order Details</h2>
                        <button className="odm__close-btn" onClick={onClose}>
                            <FiX />
                        </button>
                    </div>

                    <div className="odm__body">
                        {/* Status Stepper */}
                        <div className="odm__stepper">
                            {statusSteps.map((step, idx) => (
                                <React.Fragment key={step.key}>
                                    <div className={`odm__step ${idx <= currentStepIndex ? "odm__step--completed" : ""} ${idx === currentStepIndex ? "odm__step--active" : ""}`}>
                                        <div className="odm__step-icon">
                                            {idx < currentStepIndex ? <FiCheck /> : step.icon}
                                        </div>
                                        <span className="odm__step-label">{step.label}</span>
                                    </div>
                                    {idx < statusSteps.length - 1 && (
                                        <div className={`odm__step-line ${idx < currentStepIndex ? "odm__step-line--completed" : ""}`}></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Order Info */}
                        <div className="odm__section">
                            <h3>Order Information</h3>
                            <div className="odm__info-grid">
                                <div className="odm__info-item">
                                    <span className="odm__info-label">Order ID:</span>
                                    <span className="odm__info-value">{order.orderId}</span>
                                </div>
                                <div className="odm__info-item">
                                    <span className="odm__info-label">Order Date:</span>
                                    <span className="odm__info-value">{formatDate(order.orderDate)}</span>
                                </div>
                                <div className="odm__info-item">
                                    <span className="odm__info-label">Payment Method:</span>
                                    <span className="odm__info-value">{order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</span>
                                </div>
                                <div className="odm__info-item">
                                    <span className="odm__info-label">Payment Status:</span>
                                    <span className="odm__info-value">{order.paymentStatus || "Pending"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="odm__section">
                            <h3>Shipping Address</h3>
                            <div className="odm__address-box">
                                <p><FiUser /> {order.shippingAddress?.fullName}</p>
                                <p><FiMapPin /> {order.shippingAddress?.addressLine1}</p>
                                {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress?.addressLine2}</p>}
                                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                                <p><FiPhone /> {order.shippingAddress?.phone}</p>
                                {order.shippingAddress?.landmark && <p>Landmark: {order.shippingAddress?.landmark}</p>}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="odm__section">
                            <h3>Order Items</h3>
                            <div className="odm__items-table-wrapper">
                                <table className="odm__items-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Design</th>
                                            <th>Qty</th>
                                            <th>Price</th>
                                            <th>Total</th>
                                            {isDelivered && <th>Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items?.map((item, idx) => {
                                            const reviewKey = `${item.productId}-${item.variationId}`;
                                            const existingReview = reviews[reviewKey];
                                            const hasReview = !!existingReview;

                                            return (
                                                <tr key={idx}>
                                                    <td>
                                                        <div className="odm__product-info">
                                                            <img src={item.thumbnail} alt={item.productName} />
                                                            <span>{item.productName}</span>
                                                        </div>
                                                    </td>
                                                    <td>{item.designName}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{formatPrice(item.sellingPrice)}</td>
                                                    <td>{formatPrice(item.sellingPrice * item.quantity)}</td>
                                                    {isDelivered && (
                                                        <td>
                                                            {hasReview ? (
                                                                <div className="odm__review-display">
                                                                    {renderStarRating(existingReview.rating)}
                                                                    <p className="odm__review-comment">{existingReview.comment.substring(0, 60)}...</p>
                                                                    <button
                                                                        className="odm__edit-review-btn"
                                                                        onClick={() => handleReviewClick(item)}
                                                                    >
                                                                        Edit Review
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    className="odm__review-btn"
                                                                    onClick={() => handleReviewClick(item)}
                                                                >
                                                                    Write Review
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Price Summary */}
                        <div className="odm__section">
                            <h3>Price Summary</h3>
                            <div className="odm__price-summary">
                                <div className="odm__summary-row">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                {order.savings > 0 && (
                                    <div className="odm__summary-row odm__summary-row--savings">
                                        <span>Savings</span>
                                        <span>- {formatPrice(order.savings)}</span>
                                    </div>
                                )}
                                <div className="odm__summary-row">
                                    <span>Shipping</span>
                                    <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
                                </div>
                                <div className="odm__summary-row">
                                    <span>Tax (GST 18%)</span>
                                    <span>{formatPrice(order.tax)}</span>
                                </div>
                                <div className="odm__summary-divider"></div>
                                <div className="odm__summary-row odm__summary-row--total">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="odm__footer">
                        {canCancel && (
                            <button className="odm__cancel-order-btn" onClick={handleCancelOrder} disabled={cancelling}>
                                {cancelling ? "Cancelling..." : "Cancel Order"}
                            </button>
                        )}
                        <button className="odm__close-modal-btn" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Review Modal */}
            {reviewModalOpen && selectedReviewItem && (
                <EditReviewModal
                    review={selectedReviewItem.review}
                    productName={selectedReviewItem.productName}
                    designName={selectedReviewItem.designName}
                    onClose={() => setReviewModalOpen(false)}
                    onUpdate={handleReviewUpdate}
                    onDelete={handleReviewDelete}
                />
            )}
        </>
    );
};

export default OrderDetailsModal;