import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiTrash2, FiHeart } from "react-icons/fi";
import { IoClose } from "react-icons/io5";

import "./WishlistPage.scss";

const WishlistPage = () => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredProduct, setHoveredProduct] = useState(null);
    const [removingItem, setRemovingItem] = useState(null);
    const navigate = useNavigate();

    // Fetch wishlist
    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/wishlist/get`, {
                credentials: "include",
            });
            const data = await response.json();

            if (data.success) {
                setWishlistItems(data.data);
            } else {
                toast.error(data.message || "Failed to fetch wishlist");
            }
        } catch (error) {
            toast.error("Failed to load wishlist");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    // Remove single item from wishlist
    const handleRemoveItem = async (productId, variationId, e) => {
        e.stopPropagation();
        setRemovingItem(`${productId}-${variationId}`);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/wishlist/remove/${productId}/${variationId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            const data = await response.json();

            if (data.success) {
                toast.success("Item removed from wishlist");
                fetchWishlist();
            } else {
                toast.error(data.message || "Failed to remove");
            }
        } catch (error) {
            toast.error("Failed to remove item");
        } finally {
            setRemovingItem(null);
        }
    };

    // Move to cart (placeholder - will implement later)
    const handleMoveToCart = (item, e) => {
        e.stopPropagation();
        toast.success(`Added ${item.productName} (${item.designName}) to cart`);
        // TODO: Implement add to cart functionality
    };

    // Clear all wishlist
    const handleClearAll = async () => {
        if (wishlistItems.length === 0) return;

        const confirm = window.confirm("Are you sure you want to clear your entire wishlist?");
        if (!confirm) return;

        try {
            const itemsToRemove = wishlistItems.map(item => ({
                productId: item.productId,
                variationId: item.variationId,
            }));

            const response = await fetch(`${import.meta.env.VITE_API_URL}/wishlist/remove-multiple`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ items: itemsToRemove }),
            });
            const data = await response.json();

            if (data.success) {
                toast.success("Wishlist cleared");
                fetchWishlist();
            } else {
                toast.error(data.message || "Failed to clear wishlist");
            }
        } catch (error) {
            toast.error("Failed to clear wishlist");
        }
    };

    // Format price
    const formatPrice = (price) => {
        return `₹${price?.toFixed(2) || "0.00"}`;
    };

    // Calculate discount percentage
    const getDiscountPercentage = (sellingPrice, originalPrice) => {
        if (!originalPrice || originalPrice <= sellingPrice) return null;
        const discount = Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
        return discount;
    };

    // Get display image (thumbnail or hover image)
    const getDisplayImage = (item, isHovered) => {
        if (isHovered && item.variationImage) {
            return item.variationImage;
        }
        return item.thumbnail;
    };

    // Capitalize first letter
    const capitalizeFirst = (str) => {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Calculate summary
    const calculateSummary = () => {
        const totalItems = wishlistItems.length;
        const totalValue = wishlistItems.reduce((sum, item) => sum + (item.sellingPrice || 0), 0);
        const totalDiscount = wishlistItems.reduce((sum, item) => {
            const discount = (item.originalPrice || 0) - (item.sellingPrice || 0);
            return sum + (discount > 0 ? discount : 0);
        }, 0);

        return { totalItems, totalValue, totalDiscount };
    };

    const summary = calculateSummary();

    // Product Card Component
    const ProductCard = ({ item }) => {
        const isHovered = hoveredProduct === item.productId;
        const discountPercent = getDiscountPercentage(item.sellingPrice, item.originalPrice);
        const isRemoving = removingItem === `${item.productId}-${item.variationId}`;

        return (
            <div
                className="wp__product-card"
                onMouseEnter={() => setHoveredProduct(item.productId)}
                onMouseLeave={() => setHoveredProduct(null)}
            >
                <div className="wp__product-image-wrap">
                    <button
                        className="wp__remove-btn"
                        onClick={(e) => handleRemoveItem(item.productId, item.variationId, e)}
                        disabled={isRemoving}
                    >
                        {isRemoving ? <span className="wp__remove-spinner"></span> : <IoClose />}
                    </button>

                    <img
                        src={getDisplayImage(item, isHovered)}
                        alt={item.productName}
                        className="wp__product-img"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/300x400?text=No+Image";
                        }}
                    />
                </div>

                <div className="wp__product-info">
                    <h3 className="wp__product-name">{item.productName}</h3>
                    <div className="wp__product-meta">
                        <span className="wp__product-category">{capitalizeFirst(item.subCategory)}</span>
                        <span className="wp__product-separator">•</span>
                        <span className="wp__product-design">{item.designName}</span>
                    </div>
                    <div className="wp__product-prices">
                        <span className="wp__current-price">{formatPrice(item.sellingPrice)}</span>
                        {item.originalPrice && item.originalPrice > item.sellingPrice && (
                            <>
                                <span className="wp__original-price">{formatPrice(item.originalPrice)}</span>
                                {discountPercent && (
                                    <span className="wp__discount-badge">{discountPercent}% OFF</span>
                                )}
                            </>
                        )}
                    </div>
                    <button
                        className="wp__move-to-cart"
                        onClick={(e) => handleMoveToCart(item, e)}
                    >
                        Move to Cart
                    </button>
                </div>
            </div>
        );
    };

    // Summary Card Component
    const SummaryCard = () => {
        return (
            <div className="wp__summary-card">
                <h2>Wishlist Summary</h2>
                <div className="wp__summary-row">
                    <span>Total Items</span>
                    <span>{summary.totalItems}</span>
                </div>
                {summary.totalDiscount > 0 && (
                    <div className="wp__summary-row">
                        <span>Total Discount</span>
                        <span>{formatPrice(summary.totalDiscount)}</span>
                    </div>
                )}
                <div className="wp__summary-row total">
                    <span>Total Value</span>
                    <span>{formatPrice(summary.totalValue)}</span>
                </div>
                <button className="wp__continue-btn" onClick={() => navigate("/drinkware")}>
                    CONTINUE SHOPPING
                </button>
                <button className="wp__clear-btn" onClick={handleClearAll}>
                    Clear Wishlist
                </button>
            </div>
        );
    };

    // Loading State
    if (loading) {
        return (
            <div className="wp">
                <ToastContainer position="top-right" autoClose={3000} />
                <div className="wp__loading">
                    <div className="wp__loading-spinner"></div>
                    <p>Loading your wishlist...</p>
                </div>
            </div>
        );
    }

    // Empty State
    if (wishlistItems.length === 0) {
        return (
            <div className="wp">
                <ToastContainer position="top-right" autoClose={3000} />
                <div className="wp__empty">
                    <div className="wp__empty-icon">
                        <FiHeart />
                    </div>
                    <h2>Your wishlist is empty</h2>
                    <p>Save your favorite items here to buy them later</p>
                    <button className="wp__empty-btn" onClick={() => navigate("/drinkware")}>
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    // Main Render with Grid Layout
    const isMobile = window.innerWidth <= 768;
    const items = [...wishlistItems];

    return (
        <div className="wp">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="wp__container">
                {/* Header */}
                <div className="wp__header">
                    <h1>My Wishlist</h1>
                    <span className="wp__count">{wishlistItems.length} items</span>
                </div>

                {/* Products Grid */}
                <div className="wp__content">
                    {isMobile ? (
                        // Mobile: Products first, then summary below
                        <>
                            <div className="wp__products-grid">
                                {items.map((item) => (
                                    <ProductCard key={`${item.productId}-${item.variationId}`} item={item} />
                                ))}
                            </div>
                            <div className="wp__summary-mobile">
                                <SummaryCard />
                            </div>
                        </>
                    ) : (
                        // Desktop/Tablet: Summary integrated in grid
                        <>
                            {items.length <= 3 ? (
                                <div className="wp__products-grid">
                                    {items.map((item) => (
                                        <ProductCard key={`${item.productId}-${item.variationId}`} item={item} />
                                    ))}
                                    <SummaryCard />
                                </div>
                            ) : (
                                <>
                                    <div className="wp__products-grid">
                                        {items.slice(0, 3).map((item) => (
                                            <ProductCard key={`${item.productId}-${item.variationId}`} item={item} />
                                        ))}
                                        <SummaryCard />
                                    </div>
                                    <div className="wp__products-grid">
                                        {items.slice(3).map((item) => (
                                            <ProductCard key={`${item.productId}-${item.variationId}`} item={item} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WishlistPage;