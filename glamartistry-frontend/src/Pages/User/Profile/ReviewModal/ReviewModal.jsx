import React, { useState } from "react";
import { toast } from "react-toastify";
import { FiX, FiStar } from "react-icons/fi";

const ReviewModal = ({ orderId, productId, variationId, productName, designName, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }
        if (!comment.trim()) {
            toast.error("Please write a review comment");
            return;
        }
        if (comment.length > 1000) {
            toast.error("Comment cannot exceed 1000 characters");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reviews/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    orderId: orderId,
                    productId: productId,
                    variationId: variationId,
                    rating: rating,
                    comment: comment.trim(),
                }),
            });
            const data = await response.json();

            if (data.success) {
                toast.success("Review submitted successfully!");
                onSuccess(); // Refresh orders to update review status
                onClose(); // Close modal
            } else {
                toast.error(data.message || "Failed to submit review");
            }
        } catch (error) {
            console.error("Review submission error:", error);
            toast.error("Failed to submit review");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rm__overlay" onClick={onClose}>
            <div className="rm__modal" onClick={(e) => e.stopPropagation()}>
                <div className="rm__header">
                    <h2>Write a Review</h2>
                    <button className="rm__close-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className="rm__body">
                    <div className="rm__product-info">
                        <p className="rm__product-name">{productName}</p>
                        <p className="rm__product-design">Design: {designName}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="rm__form">
                        <div className="rm__rating-section">
                            <label>Your Rating *</label>
                            <div className="rm__stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <FiStar
                                        key={star}
                                        className={`rm__star ${star <= (hoverRating || rating) ? "rm__star--filled" : ""}`}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="rm__form-group">
                            <label>Your Review *</label>
                            <textarea
                                rows="5"
                                placeholder="Share your experience with this product..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                required
                            />
                            <div className="rm__char-count">
                                {comment.length}/1000 characters
                            </div>
                        </div>

                        <div className="rm__form-actions">
                            <button type="button" className="rm__cancel-btn" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="rm__submit-btn" disabled={loading}>
                                {loading ? "Submitting..." : "Submit Review"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;