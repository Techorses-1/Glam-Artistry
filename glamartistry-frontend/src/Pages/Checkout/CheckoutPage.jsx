import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FiTruck,
    FiCreditCard,
    FiSmartphone,
    FiCheck,
    FiChevronRight,
    FiChevronLeft,
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiX,
} from "react-icons/fi";
import "./CheckoutPage.scss";

const CheckoutPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState("cod");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [buyNowMode, setBuyNowMode] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Address form state
    const [addressForm, setAddressForm] = useState({
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        addressType: "home",
        isDefault: false,
    });

    // Order summary state
    const [orderSummary, setOrderSummary] = useState({
        subtotal: 0,
        totalSavings: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        originalTotal: 0,
    });

    // Check authentication
    const checkAuth = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile`, {
                credentials: "include",
            });
            if (response.ok) {
                setIsAuthenticated(true);
                return true;
            } else {
                toast.error("Please login to continue");
                navigate("/login");
                return false;
            }
        } catch (error) {
            toast.error("Authentication failed");
            navigate("/login");
            return false;
        }
    };

    // Fetch cart items
    const fetchCart = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/cart/get`, {
                credentials: "include",
            });
            const data = await response.json();

            if (data.success && data.data.length > 0) {
                setCartItems(data.data);
                calculateSummary(data.data);
            } else {
                toast.error("Your cart is empty");
                navigate("/drinkware");
            }
        } catch (error) {
            toast.error("Failed to load cart");
            navigate("/drinkware");
        } finally {
            setLoading(false);
        }
    };

    // Fetch addresses
    const fetchAddresses = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/address/get`, {
                credentials: "include",
            });
            const data = await response.json();
            if (data.success) {
                setAddresses(data.data);
                const defaultAddress = data.data.find(addr => addr.isDefault);
                if (defaultAddress) {
                    setSelectedAddress(defaultAddress);
                } else if (data.data.length > 0) {
                    setSelectedAddress(data.data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch addresses:", error);
        }
    };

    // Calculate order summary
    const calculateSummary = (items) => {
        let subtotal = 0;
        let originalTotal = 0;

        items.forEach(item => {
            subtotal += item.sellingPrice * item.quantity;
            originalTotal += item.originalPrice * item.quantity;
        });

        const totalSavings = originalTotal - subtotal;
        const shipping = 50; // FREE SHIPPING
        const tax = subtotal * 0.18; // 5% GST
        const total = subtotal + shipping + tax;

        setOrderSummary({
            subtotal,
            totalSavings,
            shipping,
            tax,
            total,
            originalTotal,
        });
    };

    // Initialize checkout
    useEffect(() => {
        const initCheckout = async () => {
            const isAuth = await checkAuth();
            if (!isAuth) return;

            // Check if coming from Buy Now button
            if (location.state?.buyNowMode && location.state?.product) {
                setBuyNowMode(true);
                const singleProduct = [location.state.product];
                setCartItems(singleProduct);
                calculateSummary(singleProduct);
                fetchAddresses();
            } else {
                // Normal cart checkout
                fetchCart();
                fetchAddresses();
            }
        };

        initCheckout();
    }, []);

    // Handle address selection
    const handleAddressSelect = (address) => {
        setSelectedAddress(address);
    };

    // Handle address form change
    const handleAddressFormChange = (e) => {
        setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
    };

    // Save new address and auto-select it
    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setLoading(true);

        const url = editingAddress
            ? `${import.meta.env.VITE_API_URL}/address/update/${editingAddress._id}`
            : `${import.meta.env.VITE_API_URL}/address/create`;
        const method = editingAddress ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(addressForm),
            });
            const data = await response.json();

            if (data.success) {
                toast.success(editingAddress ? "Address updated" : "Address added");
                setShowAddressModal(false);
                await fetchAddresses();

                // Auto-select the newly created/updated address
                if (data.data && data.data._id) {
                    setSelectedAddress(data.data);
                } else if (data.data) {
                    setSelectedAddress(data.data);
                }

                setEditingAddress(null);
                setAddressForm({
                    fullName: "",
                    phone: "",
                    addressLine1: "",
                    addressLine2: "",
                    city: "",
                    state: "",
                    pincode: "",
                    landmark: "",
                    addressType: "home",
                    isDefault: false,
                });
            } else {
                toast.error(data.message || "Failed to save address");
            }
        } catch (error) {
            toast.error("Failed to save address");
        } finally {
            setLoading(false);
        }
    };

    // Open add address modal
    const openAddAddressModal = () => {
        setEditingAddress(null);
        setAddressForm({
            fullName: "",
            phone: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            pincode: "",
            landmark: "",
            addressType: "home",
            isDefault: false,
        });
        setShowAddressModal(true);
    };

    // Open edit address modal
    const openEditAddressModal = (address) => {
        setEditingAddress(address);
        setAddressForm({
            fullName: address.fullName || "",
            phone: address.phone || "",
            addressLine1: address.addressLine1 || "",
            addressLine2: address.addressLine2 || "",
            city: address.city || "",
            state: address.state || "",
            pincode: address.pincode || "",
            landmark: address.landmark || "",
            addressType: address.addressType || "home",
            isDefault: address.isDefault || false,
        });
        setShowAddressModal(true);
    };

    // Delete address
    const handleDeleteAddress = async (addressId) => {
        const confirm = window.confirm("Are you sure you want to delete this address?");
        if (!confirm) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/address/delete/${addressId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Address deleted");
                await fetchAddresses();
                if (selectedAddress?._id === addressId) {
                    setSelectedAddress(null);
                }
            } else {
                toast.error(data.message || "Failed to delete");
            }
        } catch (error) {
            toast.error("Failed to delete address");
        }
    };

    // Place order with REAL API
    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            toast.error("Please select a delivery address");
            return;
        }

        setLoading(true);

        // Prepare order items
        const orderItems = cartItems.map(item => ({
            productId: item.productId,
            variationId: item.variationId,
            quantity: item.quantity,
        }));

        // Prepare shipping address
        const shippingAddress = {
            fullName: selectedAddress.fullName,
            phone: selectedAddress.phone,
            addressLine1: selectedAddress.addressLine1,
            addressLine2: selectedAddress.addressLine2 || "",
            city: selectedAddress.city,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode,
            landmark: selectedAddress.landmark || "",
        };

        // Determine order type
        const orderType = buyNowMode ? "buynow" : "cart";

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    items: orderItems,
                    shippingAddress,
                    paymentMethod: selectedPayment,
                    orderType,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Set real order ID from backend
                setOrderId(data.data.orderId);
                setShowSuccessModal(true);
                toast.success("Order placed successfully!");

                // Auto redirect after 4 seconds
                setTimeout(() => {
                    setShowSuccessModal(false);
                    navigate("/profile", { state: { activeTab: "orders" } });
                }, 4000);
            } else {
                toast.error(data.message || "Failed to place order");
            }
        } catch (error) {
            console.error("Place order error:", error);
            toast.error("Failed to place order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Continue to next step
    const handleNextStep = () => {
        if (currentStep === 1) {
            if (cartItems.length === 0) {
                toast.error("Your cart is empty");
                return;
            }
            setCurrentStep(2);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (currentStep === 2) {
            if (!selectedAddress) {
                toast.error("Please select a delivery address");
                return;
            }
            setCurrentStep(3);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Go back to previous step
    const handlePrevStep = () => {
        setCurrentStep(currentStep - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Format price
    const formatPrice = (price) => `₹${price?.toFixed(2) || "0.00"}`;

    // Capitalize first letter
    const capitalizeFirst = (str) => {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Get address display text
    const getAddressDisplay = (address) => {
        return `${address.fullName}, ${address.addressLine1}${address.addressLine2 ? `, ${address.addressLine2}` : ""}, ${address.city}, ${address.state} - ${address.pincode}`;
    };

    if (loading && cartItems.length === 0) {
        return (
            <div className="checkout-loading">
                <div className="loading-spinner"></div>
                <p>Loading checkout...</p>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="checkout-wrapper">
                <div className="checkout-container">
                    {/* Header */}
                    <div className="checkout-header">
                        <h1>Checkout</h1>
                    </div>

                    {/* Stepper */}
                    <div className="stepper">
                        <div className={`step ${currentStep >= 1 ? "active" : ""} ${currentStep > 1 ? "completed" : ""}`}>
                            <div className="step-circle">
                                {currentStep > 1 ? <FiCheck /> : "1"}
                            </div>
                            <span className="step-label">Order Summary</span>
                        </div>
                        <div className="step-line"></div>
                        <div className={`step ${currentStep >= 2 ? "active" : ""} ${currentStep > 2 ? "completed" : ""}`}>
                            <div className="step-circle">
                                {currentStep > 2 ? <FiCheck /> : "2"}
                            </div>
                            <span className="step-label">Delivery Address</span>
                        </div>
                        <div className="step-line"></div>
                        <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
                            <div className="step-circle">3</div>
                            <span className="step-label">Payment</span>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="step-content">
                        {/* STEP 1: Order Summary */}
                        {currentStep === 1 && (
                            <div className="step-panel order-summary-panel">
                                <h2>Order Summary</h2>

                                <div className="order-items">
                                    {cartItems.map((item) => (
                                        <div key={`${item.productId}-${item.variationId}`} className="order-item">
                                            <div className="item-image">
                                                <img
                                                    src={item.thumbnail}
                                                    alt={item.productName}
                                                    onError={(e) => e.target.src = "https://via.placeholder.com/80x80?text=No+Image"}
                                                />
                                            </div>
                                            <div className="item-details">
                                                <h4 className="item-name">{item.productName}</h4>
                                                <p className="item-design">Design: {item.designName}</p>
                                                <p className="item-quantity">Qty: {item.quantity}</p>
                                            </div>
                                            <div className="item-price">
                                                <span className="selling-price">{formatPrice(item.sellingPrice * item.quantity)}</span>
                                                {item.originalPrice > item.sellingPrice && (
                                                    <span className="original-price">{formatPrice(item.originalPrice * item.quantity)}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="price-breakdown">
                                    <div className="breakdown-row">
                                        <span>Original Price</span>
                                        <span>{formatPrice(orderSummary.originalTotal)}</span>
                                    </div>
                                    <div className="breakdown-row savings">
                                        <span>Savings</span>
                                        <span>- {formatPrice(orderSummary.totalSavings)}</span>
                                    </div>
                                    <div className="breakdown-row">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(orderSummary.subtotal)}</span>
                                    </div>
                                    <div className="breakdown-row">
                                        <span>Shipping</span>
                                        <span>₹50</span>
                                    </div>
                                    <div className="breakdown-row">
                                        <span>Tax (GST 18%)</span>
                                        <span>{formatPrice(orderSummary.tax)}</span>
                                    </div>
                                    <div className="breakdown-divider"></div>
                                    <div className="breakdown-row total">
                                        <span>Total</span>
                                        <span>{formatPrice(orderSummary.total)}</span>
                                    </div>
                                </div>

                                <div className="step-actions">
                                    <button className="btn-next" onClick={handleNextStep}>
                                        Continue to Address <FiChevronRight />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Delivery Address */}
                        {currentStep === 2 && (
                            <div className="step-panel address-panel">
                                <h2>Select Delivery Address</h2>

                                {/* Existing Addresses */}
                                {addresses.length > 0 && (
                                    <div className="addresses-list">
                                        {addresses.map((address) => (
                                            <div
                                                key={address._id}
                                                className={`address-card ${selectedAddress?._id === address._id ? "selected" : ""}`}
                                                onClick={() => handleAddressSelect(address)}
                                            >
                                                <div className="address-radio">
                                                    <div className={`radio-circle ${selectedAddress?._id === address._id ? "selected" : ""}`}>
                                                        {selectedAddress?._id === address._id && <div className="radio-dot"></div>}
                                                    </div>
                                                </div>
                                                <div className="address-details">
                                                    <div className="address-header">
                                                        <span className="address-name">{address.fullName}</span>
                                                        {address.isDefault && <span className="default-badge">Default</span>}
                                                        <span className="address-type">{capitalizeFirst(address.addressType)}</span>
                                                    </div>
                                                    <p className="address-text">{getAddressDisplay(address)}</p>
                                                    <p className="address-phone">Phone: {address.phone}</p>
                                                </div>
                                                <div className="address-actions">
                                                    <button
                                                        className="edit-address"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditAddressModal(address);
                                                        }}
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        className="delete-address"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteAddress(address._id);
                                                        }}
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add New Address Button */}
                                <button className="add-address-btn" onClick={openAddAddressModal}>
                                    <FiPlus /> Add New Address
                                </button>

                                <div className="step-actions">
                                    <button className="btn-prev" onClick={handlePrevStep}>
                                        <FiChevronLeft /> Back
                                    </button>
                                    <button className="btn-next" onClick={handleNextStep} disabled={!selectedAddress}>
                                        Continue to Payment <FiChevronRight />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Payment */}
                        {currentStep === 3 && (
                            <div className="step-panel payment-panel">
                                <h2>Select Payment Method</h2>

                                <div className="payment-methods-grid">
                                    <div
                                        className={`payment-option ${selectedPayment === "cod" ? "selected" : ""}`}
                                        onClick={() => setSelectedPayment("cod")}
                                    >
                                        <div className="payment-radio">
                                            <div className={`radio-circle ${selectedPayment === "cod" ? "selected" : ""}`}>
                                                {selectedPayment === "cod" && <div className="radio-dot"></div>}
                                            </div>
                                        </div>
                                        <div className="payment-icon">
                                            <FiTruck />
                                        </div>
                                        <div className="payment-info">
                                            <h4>Cash on Delivery</h4>
                                            <p>Pay when you receive</p>
                                        </div>
                                        <div className="payment-status">
                                            <span className="available-badge">Available</span>
                                        </div>
                                    </div>

                                    <div className="payment-option disabled">
                                        <div className="payment-icon">
                                            <FiCreditCard />
                                        </div>
                                        <div className="payment-info">
                                            <h4>Card Payment</h4>
                                            <p>Credit / Debit Card</p>
                                        </div>
                                        <div className="payment-status">
                                            <span className="coming-soon-badge">Coming Soon</span>
                                        </div>
                                    </div>

                                    <div className="payment-option disabled">
                                        <div className="payment-icon">
                                            <FiSmartphone />
                                        </div>
                                        <div className="payment-info">
                                            <h4>UPI Payment</h4>
                                            <p>Google Pay, PhonePe</p>
                                        </div>
                                        <div className="payment-status">
                                            <span className="coming-soon-badge">Coming Soon</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Summary Sidebar */}
                                <div className="payment-summary">
                                    <div className="summary-card">
                                        <h4>Order Summary</h4>
                                        <div className="summary-row">
                                            <span>Items ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
                                            <span>{formatPrice(orderSummary.subtotal)}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Shipping</span>
                                            <span>₹50</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Tax (GST 18%)</span>
                                            <span>{formatPrice(orderSummary.tax)}</span>
                                        </div>
                                        <div className="summary-divider"></div>
                                        <div className="summary-row total">
                                            <span>Total to Pay</span>
                                            <span>{formatPrice(orderSummary.total)}</span>
                                        </div>
                                        <p className="payment-note">*Cash on Delivery only for now</p>
                                    </div>
                                </div>

                                <div className="step-actions">
                                    <button className="btn-prev" onClick={handlePrevStep}>
                                        <FiChevronLeft /> Back
                                    </button>
                                    <button className="btn-place-order" onClick={handlePlaceOrder} disabled={loading}>
                                        {loading ? "Placing Order..." : "Place Order"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Address Modal (Popup) */}
            {showAddressModal && (
                <div className="address-modal-overlay" onClick={() => setShowAddressModal(false)}>
                    <div className="address-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="address-modal-header">
                            <h3>{editingAddress ? "Edit Address" : "Add New Address"}</h3>
                            <button className="address-modal-close" onClick={() => setShowAddressModal(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="address-modal-body">
                            <form onSubmit={handleSaveAddress} className="address-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={addressForm.fullName}
                                            onChange={handleAddressFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={addressForm.phone}
                                            onChange={handleAddressFormChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Address Line 1 *</label>
                                    <input
                                        type="text"
                                        name="addressLine1"
                                        value={addressForm.addressLine1}
                                        onChange={handleAddressFormChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Address Line 2 (Optional)</label>
                                    <input
                                        type="text"
                                        name="addressLine2"
                                        value={addressForm.addressLine2}
                                        onChange={handleAddressFormChange}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>City *</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={addressForm.city}
                                            onChange={handleAddressFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>State *</label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={addressForm.state}
                                            onChange={handleAddressFormChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Pincode *</label>
                                        <input
                                            type="text"
                                            name="pincode"
                                            value={addressForm.pincode}
                                            onChange={handleAddressFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Landmark (Optional)</label>
                                        <input
                                            type="text"
                                            name="landmark"
                                            value={addressForm.landmark}
                                            onChange={handleAddressFormChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Address Type</label>
                                        <select
                                            name="addressType"
                                            value={addressForm.addressType}
                                            onChange={handleAddressFormChange}
                                        >
                                            <option value="home">Home</option>
                                            <option value="office">Office</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                name="isDefault"
                                                checked={addressForm.isDefault}
                                                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                                            />
                                            Set as default address
                                        </label>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowAddressModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-save" disabled={loading}>
                                        {loading ? "Saving..." : editingAddress ? "Update Address" : "Save Address"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal with REAL Order ID and Auto Redirect */}
            {showSuccessModal && (
                <div className="success-modal-overlay" onClick={() => { }}>
                    <div className="success-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="success-icon">
                            <FiCheck />
                        </div>
                        <h2>Order Placed Successfully!</h2>
                        <p>Your order has been placed successfully.</p>
                        <div className="order-id">
                            <span>Order ID:</span>
                            <strong>{orderId}</strong>
                        </div>
                        <p className="order-message">Redirecting to your orders in 4 seconds...</p>
                        <button
                            className="continue-btn"
                            onClick={() => {
                                setShowSuccessModal(false);
                                navigate("/profile", { state: { activeTab: "orders" } });
                            }}
                        >
                            View Orders Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPage;