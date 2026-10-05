import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiHeart } from "react-icons/fi";
import { IoClose } from "react-icons/io5";

import "./WishlistPage.scss";
import CartSidebar from "../Cart/CartSidebar";

const WishlistPage = () => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingItem, setRemovingItem] = useState(null);
    const [addingToCartItem, setAddingToCartItem] = useState(null);
    const [showCartSidebar, setShowCartSidebar] = useState(false);
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

    // Move to cart (real API call — item stays in wishlist)
    const handleMoveToCart = async (item, e) => {
        e.stopPropagation();
        setAddingToCartItem(`${item.productId}-${item.variationId}`);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/cart/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    productId: item.productId,
                    variationId: item.variationId,
                    quantity: 1,
                    designName: item.designName,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`${item.productName} (${item.designName}) added to cart`);
                setShowCartSidebar(true);
                window.dispatchEvent(new Event("cartUpdated"));
            } else {
                toast.error(data.message || "Failed to add to cart");
            }
        } catch (error) {
            toast.error("Failed to add to cart");
        } finally {
            setAddingToCartItem(null);
        }
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

    const ProductCard = ({ item }) => {
        const navigate = useNavigate();   // ⬅️ ADD

        const discountPercent = getDiscountPercentage(item.sellingPrice, item.originalPrice);
        const isRemoving = removingItem === `${item.productId}-${item.variationId}`;
        const isAddingToCart = addingToCartItem === `${item.productId}-${item.variationId}`;

        const handleCardClick = () => {
            navigate(`/product/${item.slug || item.productId}`);
        };

        return (
            <div
                className="wp__product-card"
                onClick={handleCardClick}    // ⬅️ ADD
                style={{ cursor: "pointer" }}
            >
                <div className="wp__product-image-wrap">
                    <button
                        className="wp__remove-btn"
                        onClick={(e) => {
                            e.stopPropagation();    // ⬅️ ADD — warna card click bhi ho jayega
                            handleRemoveItem(item.productId, item.variationId, e);
                        }}
                        disabled={isRemoving}
                    >
                        {isRemoving ? <span className="wp__remove-spinner"></span> : <IoClose />}
                    </button>

                    <img
                        src={item.thumbnail}
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
                        onClick={(e) => {
                            e.stopPropagation();   // ⬅️ ADD — warna navigate bhi ho jayega
                            handleMoveToCart(item, e);
                        }}
                        disabled={isAddingToCart}
                    >
                        {isAddingToCart ? (
                            <>
                                <span className="wp__btn-spinner"></span>
                                Adding...
                            </>
                        ) : (
                            "Move to Cart"
                        )}
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
                {/* <ToastContainer position="top-right" autoClose={3000} /> */}
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
                {/* <ToastContainer position="top-right" autoClose={3000} /> */}
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
            {/* <ToastContainer position="top-right" autoClose={3000} /> */}

            <div className="wp__container">
                {/* Header */}
                <div className="wp__header">
                    <h1>My Wishlist</h1>
                    <span className="wp__count">{wishlistItems.length} items</span>
                </div>

                {/* Products Grid */}
                <div className="wp__content">
                    {isMobile ? (
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

            {/* Cart Sidebar */}
            <CartSidebar
                isOpen={showCartSidebar}
                onClose={() => setShowCartSidebar(false)}
            />
        </div>
    );
};

export default WishlistPage;