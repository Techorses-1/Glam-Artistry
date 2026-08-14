import React from "react";
import { FiX, FiStar } from "react-icons/fi";

const ProductReviewModal = ({ reviews, averageRating, totalReviews, productName, variationName, onClose }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const renderStarRating = (rating) => {
        return (
            <div className="prm__stars">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                        key={star}
                        className={star <= rating ? "prm__star--filled" : "prm__star--empty"}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="prm__overlay" onClick={onClose}>
            <div className="prm__modal" onClick={(e) => e.stopPropagation()}>
                <div className="prm__header">
                    <h2>Customer Reviews</h2>
                    <button className="prm__close-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className="prm__body">
                    {/* Product Info & Rating Summary */}
                    <div className="prm__summary">
                        <div className="prm__product-info">
                            <h3>{productName}</h3>
                            {variationName && <p>Design: {variationName}</p>}
                        </div>
                        <div className="prm__rating-summary">
                            <div className="prm__average-rating">
                                <span className="prm__rating-number">{averageRating.toFixed(1)}</span>
                                <div className="prm__rating-stars">
                                    {renderStarRating(Math.round(averageRating))}
                                </div>
                            </div>
                            <div className="prm__total-reviews">
                                Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                            </div>
                        </div>
                    </div>

                    {/* Reviews List */}
                    <div className="prm__reviews-list">
                        {reviews.length === 0 ? (
                            <div className="prm__empty-reviews">
                                <p>No reviews yet for this product.</p>
                                <p className="prm__empty-note">
                                    Be the first to review this product!
                                </p>
                            </div>
                        ) : (
                            reviews.map((review, idx) => (
                                <div key={idx} className="prm__review-card">
                                    <div className="prm__review-header">
                                        <div className="prm__reviewer-info">
                                            <span className="prm__reviewer-name">
                                                {review.userId?.name || "Anonymous User"}
                                            </span>
                                            <span className="prm__review-date">
                                                {formatDate(review.createdAt)}
                                            </span>
                                        </div>
                                        {review.isEdited && (
                                            <span className="prm__edited-badge">(Edited)</span>
                                        )}
                                    </div>
                                    <div className="prm__review-rating">
                                        {renderStarRating(review.rating)}
                                    </div>
                                    <p className="prm__review-comment">{review.comment}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="prm__footer">
                    <button className="prm__close-modal-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductReviewModal;