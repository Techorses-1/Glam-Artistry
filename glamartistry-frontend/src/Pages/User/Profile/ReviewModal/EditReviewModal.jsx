import React, { useState } from "react";
import { toast } from "react-toastify";
import { FiX, FiStar, FiTrash2 } from "react-icons/fi";

const EditReviewModal = ({ review, productName, designName, onClose, onUpdate, onDelete }) => {
    const [rating, setRating] = useState(review.rating);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState(review.comment);
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }
        if (!comment.trim()) {
            toast.error("Please write a review comment");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reviews/update/${review.reviewId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    rating: rating,
                    comment: comment.trim(),
                }),
            });
            const data = await response.json();

            if (data.success) {
                toast.success("Review updated successfully!");
                onUpdate(data.data);
                onClose();
            } else {
                toast.error(data.message || "Failed to update review");
            }
        } catch (error) {
            toast.error("Failed to update review");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reviews/delete/${review.reviewId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await response.json();

            if (data.success) {
                toast.success("Review deleted successfully!");
                onDelete(review.reviewId);
                onClose();
            } else {
                toast.error(data.message || "Failed to delete review");
            }
        } catch (error) {
            toast.error("Failed to delete review");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rm__overlay" onClick={onClose}>
            <div className="rm__modal" onClick={(e) => e.stopPropagation()}>
                <div className="rm__header">
                    <h2>Edit Review</h2>
                    <button className="rm__close-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className="rm__body">
                    <div className="rm__product-info">
                        <p className="rm__product-name">{productName}</p>
                        <p className="rm__product-design">Design: {designName}</p>
                    </div>

                    <form onSubmit={handleUpdate} className="rm__form">
                        <div className="rm__rating-section">
                            <label>Your Rating</label>
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
                            <label>Your Review</label>
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

                        <div className="rm__form-actions rm__form-actions--with-delete">
                            <button
                                type="button"
                                className="rm__delete-btn"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <FiTrash2 /> Delete Review
                            </button>
                            <div className="rm__action-group">
                                <button type="button" className="rm__cancel-btn" onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="rm__submit-btn" disabled={loading}>
                                    {loading ? "Updating..." : "Update Review"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="rm__confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="rm__confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Review</h3>
                        <p>Are you sure you want to delete this review? This action cannot be undone.</p>
                        <div className="rm__confirm-actions">
                            <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button onClick={handleDelete} className="rm__confirm-delete">
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditReviewModal;