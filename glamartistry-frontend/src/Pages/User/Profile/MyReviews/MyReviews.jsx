import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FiStar, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import EditReviewModal from "../ReviewModal/EditReviewModal";

const MyReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReviews, setTotalReviews] = useState(0);
    const [selectedReview, setSelectedReview] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const reviewsPerPage = 10;

    // Fetch user's reviews
    const fetchMyReviews = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/reviews/my-reviews?page=${currentPage}&limit=${reviewsPerPage}`,
                {
                    credentials: "include",
                }
            );
            const data = await response.json();

            if (data.success) {
                setReviews(data.data);
                setTotalPages(data.pagination.totalPages);
                setTotalReviews(data.pagination.totalItems);
            } else {
                toast.error(data.message || "Failed to fetch reviews");
            }
        } catch (error) {
            console.error("Fetch reviews error:", error);
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyReviews();
    }, [currentPage]);

    // Handle edit review
    const handleEditClick = (review) => {
        setSelectedReview(review);
        setShowEditModal(true);
    };

    // Handle review update
    const handleReviewUpdate = (updatedReview) => {
        setReviews((prevReviews) =>
            prevReviews.map((review) =>
                review.reviewId === updatedReview.reviewId ? updatedReview : review
            )
        );
        toast.success("Review updated successfully!");
    };

    // Handle review delete
    const handleReviewDelete = (reviewId) => {
        setReviews((prevReviews) =>
            prevReviews.filter((review) => review.reviewId !== reviewId)
        );
        // Refresh to update total count
        fetchMyReviews();
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Render star rating
    const renderStarRating = (rating) => {
        return (
            <div className="mr__stars">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                        key={star}
                        className={star <= rating ? "mr__star--filled" : "mr__star--empty"}
                    />
                ))}
            </div>
        );
    };

    // Loading state
    if (loading && reviews.length === 0) {
        return (
            <div className="mr__loading">
                <div className="mr__spinner"></div>
                <p>Loading your reviews...</p>
            </div>
        );
    }

    // Empty state
    if (reviews.length === 0) {
        return (
            <div className="mr__empty">
                <div className="mr__empty-icon">📝</div>
                <h3>No Reviews Yet</h3>
                <p>You haven't written any reviews yet.</p>
                <p className="mr__empty-note">
                    Once you receive delivered orders, you can review your purchased products.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="mr">
                <div className="mr__header">
                    <h2>My Reviews</h2>
                    <span className="mr__count">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</span>
                </div>

                <div className="mr__reviews-list">
                    {reviews.map((review) => (
                        <div key={review.reviewId} className="mr__review-card">
                            <div className="mr__review-header">
                                <div className="mr__product-info">
                                    <h3 className="mr__product-name">{review.productName}</h3>
                                    <p className="mr__product-design">Design: {review.designName}</p>
                                </div>
                                <div className="mr__review-date">{formatDate(review.createdAt)}</div>
                            </div>

                            <div className="mr__review-rating">
                                {renderStarRating(review.rating)}
                                {review.isEdited && <span className="mr__edited-badge">(Edited)</span>}
                            </div>

                            <p className="mr__review-comment">{review.comment}</p>

                            <div className="mr__review-actions">
                                <button
                                    className="mr__edit-btn"
                                    onClick={() => handleEditClick(review)}
                                >
                                    <FiEdit2 /> Edit Review
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mr__pagination">
                        <button
                            className="mr__page-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                        >
                            <FiChevronLeft /> Previous
                        </button>
                        <span className="mr__page-info">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className="mr__page-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                        >
                            Next <FiChevronRight />
                        </button>
                    </div>
                )}
            </div>

            {/* Edit Review Modal */}
            {showEditModal && selectedReview && (
                <EditReviewModal
                    review={selectedReview}
                    productName={selectedReview.productName}
                    designName={selectedReview.designName}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedReview(null);
                    }}
                    onUpdate={handleReviewUpdate}
                    onDelete={handleReviewDelete}
                />
            )}
        </>
    );
};

export default MyReviews;