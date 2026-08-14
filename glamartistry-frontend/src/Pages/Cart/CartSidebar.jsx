import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiShoppingCart, FiX, FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import "./CartSidebar.scss";

const CartSidebar = ({ isOpen, onClose }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updatingItem, setUpdatingItem] = useState(null);
    const [summary, setSummary] = useState({
        totalItems: 0,
        subtotal: 0,
        totalSavings: 0,
        estimatedTotal: 0,
    });
    const navigate = useNavigate();
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Fetch cart data
    const fetchCart = async () => {
        if (!isOpen) return;

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/cart/get`, {
                credentials: "include",
            });
            const data = await response.json();

            if (data.success) {
                setCartItems(data.data || []);
                if (data.summary) {
                    setSummary({
                        totalItems: data.summary.totalItems || 0,
                        subtotal: data.summary.subtotal || 0,
                        totalSavings: data.summary.totalSavings || 0,
                        estimatedTotal: data.summary.estimatedTotal || 0,
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch cart:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCart();
        }
    }, [isOpen]);

    // Update quantity
    const handleUpdateQuantity = async (productId, variationId, newQuantity) => {
        if (newQuantity < 1) return;

        const item = cartItems.find(i => i.productId === productId && i.variationId === variationId);
        if (item && newQuantity > item.stock) {
            toast.error(`Only ${item.stock} items available in stock`);
            return;
        }

        setUpdatingItem(`${productId}-${variationId}`);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/cart/update/${productId}/${variationId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ quantity: newQuantity }),
                }
            );
            const data = await response.json();

            if (data.success) {
                fetchCart();
                window.dispatchEvent(new Event('cartUpdated'));
            } else {
                toast.error(data.message || "Failed to update quantity");
            }
        } catch (error) {
            toast.error("Failed to update cart");
        } finally {
            setUpdatingItem(null);
        }
    };

    // Remove item from cart
    const handleRemoveItem = async (productId, variationId, productName, designName) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/cart/remove/${productId}/${variationId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            const data = await response.json();

            if (data.success) {
                toast.success(`${productName} (${designName}) removed from cart`);
                fetchCart();
                window.dispatchEvent(new Event('cartUpdated'));
            } else {
                toast.error(data.message || "Failed to remove item");
            }
        } catch (error) {
            toast.error("Failed to remove item");
        }
    };

    // Clear entire cart - Open confirmation modal instead of default alert
    const handleClearCart = () => {
        if (cartItems.length === 0) return;
        setShowClearConfirm(true);
    };

    // Confirm clear cart
    const confirmClearCart = async () => {
        setShowClearConfirm(false);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/cart/clear`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await response.json();

            if (data.success) {
                toast.success("Cart cleared");
                fetchCart();
                window.dispatchEvent(new Event('cartUpdated'));
            } else {
                toast.error(data.message || "Failed to clear cart");
            }
        } catch (error) {
            toast.error("Failed to clear cart");
        }
    };

    // Proceed to checkout
    const handleCheckout = () => {
        if (cartItems.length === 0) {
            toast.error("Your cart is empty");
            return;
        }
        onClose();
        navigate("/checkout");
    };

    // Format price
    const formatPrice = (price) => {
        return `₹${price?.toFixed(2) || "0.00"}`;
    };

    // Get discount percentage
    const getDiscountPercent = (sellingPrice, originalPrice) => {
        if (originalPrice && originalPrice > sellingPrice) {
            return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
        }
        return 0;
    };

    return (
        <>
            <div className={`cart-sidebar-overlay ${isOpen ? "active" : ""}`} onClick={onClose} />

            <div className={`cart-sidebar ${isOpen ? "active" : ""}`}>
                <ToastContainer position="top-right" autoClose={3000} />

                {/* Header */}
                <div className="cart-sidebar-header">
                    <div className="header-title">
                        <FiShoppingCart />
                        <h2>My Cart</h2>
                        {summary.totalItems > 0 && (
                            <span className="item-count">{summary.totalItems} items</span>
                        )}
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                {/* Cart Content */}
                {loading && cartItems.length === 0 ? (
                    <div className="cart-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading your cart...</p>
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="cart-empty">
                        <div className="empty-icon">
                            <FiShoppingCart />
                        </div>
                        <h3>Your cart is empty</h3>
                        <p>Add items to get started</p>
                        <button className="continue-shop-btn" onClick={onClose}>
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <div className="cart-content">
                        {/* LEFT COLUMN - Products List (White BG) */}
                        <div className="cart-items-list">
                            {cartItems.map((item) => {
                                const discountPercent = getDiscountPercent(item.sellingPrice, item.originalPrice);
                                const isUpdating = updatingItem === `${item.productId}-${item.variationId}`;

                                return (
                                    <div key={`${item.productId}-${item.variationId}`} className="cart-item">
                                        {/* Image */}
                                        <div className="item-image">
                                            <img
                                                src={item.thumbnail}
                                                alt={item.productName}
                                                onError={(e) => e.target.src = "https://via.placeholder.com/80x80?text=No+Image"}
                                            />
                                        </div>

                                        {/* Product Info */}
                                        <div className="item-details">
                                            <div className="item-header">
                                                <h4 className="item-name">{item.productName}</h4>
                                                <button
                                                    className="item-remove"
                                                    onClick={() => handleRemoveItem(item.productId, item.variationId, item.productName, item.designName)}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                            <p className="item-design">Design: {item.designName}</p>

                                            {/* Quantity Selector */}
                                            <div className="item-quantity">
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => handleUpdateQuantity(item.productId, item.variationId, item.quantity - 1)}
                                                    disabled={isUpdating || item.quantity <= 1}
                                                >
                                                    <FiMinus />
                                                </button>
                                                <span className="qty-value">{item.quantity}</span>
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => handleUpdateQuantity(item.productId, item.variationId, item.quantity + 1)}
                                                    disabled={isUpdating || item.quantity >= item.stock}
                                                >
                                                    <FiPlus />
                                                </button>
                                                {item.isLowStock && (
                                                    <span className="low-stock-warning">Only {item.stock} left</span>
                                                )}
                                            </div>

                                            {/* Pricing */}
                                            <div className="item-pricing">
                                                <span className="selling-price">{formatPrice(item.sellingPrice)}</span>
                                                {item.originalPrice > item.sellingPrice && (
                                                    <>
                                                        <span className="original-price">{formatPrice(item.originalPrice)}</span>
                                                        <span className="discount-badge">{discountPercent}% OFF</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* RIGHT COLUMN - Summary (Different BG Color) */}
                        <div className="cart-summary">
                            <h3>Order Summary</h3>

                            <div className="summary-row">
                                <span>Subtotal ({summary.totalItems} items)</span>
                                <span>{formatPrice(summary.subtotal)}</span>
                            </div>

                            {summary.totalSavings > 0 && (
                                <div className="summary-row savings">
                                    <span>Savings</span>
                                    <span>- {formatPrice(summary.totalSavings)}</span>
                                </div>
                            )}

                            <div className="summary-row">
                                <span>Shipping</span>
                                <span>{summary.subtotal > 1000 ? "Free" : "Calculated at checkout"}</span>
                            </div>

                            <div className="summary-divider"></div>

                            <div className="summary-row total">
                                <span>Total</span>
                                <span>{formatPrice(summary.estimatedTotal)}</span>
                            </div>

                            {summary.subtotal > 0 && summary.subtotal < 1000 && (
                                <div className="free-shipping-message">
                                    Add {formatPrice(1000 - summary.subtotal)} more for Free Shipping
                                </div>
                            )}

                            <button className="checkout-btn" onClick={handleCheckout}>
                                Proceed to Checkout
                            </button>

                            <button className="clear-cart-btn" onClick={handleClearCart}>
                                Clear Cart
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Clear Cart Confirmation Modal */}
            {showClearConfirm && (
                <div className="confirm-overlay" onClick={() => setShowClearConfirm(false)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-modal-header">
                            <h3>Clear Cart</h3>
                            <button className="confirm-close-btn" onClick={() => setShowClearConfirm(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="confirm-modal-body">
                            <p>Are you sure you want to clear your entire cart?</p>
                            <p className="confirm-warning">This action cannot be undone.</p>
                        </div>
                        <div className="confirm-modal-actions">
                            <button className="confirm-cancel-btn" onClick={() => setShowClearConfirm(false)}>
                                Cancel
                            </button>
                            <button className="confirm-clear-btn" onClick={confirmClearCart}>
                                Yes, Clear Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CartSidebar;