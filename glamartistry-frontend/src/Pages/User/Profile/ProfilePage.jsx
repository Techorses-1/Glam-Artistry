import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FiUser,
    FiMapPin,
    FiLock,
    FiPackage,
    FiEdit2,
    FiTrash2,
    FiCheck,
    FiX,
    FiPlus,
    FiStar
} from "react-icons/fi";
import OrderCard from "./OrderCardModal/OrderCard";
import OrderDetailsModal from "./OrderDetailsModal/OrderDetailsModal";
import ReviewModal from "./ReviewModal/ReviewModal";
import "./ProfilePage.scss";
import MyReviews from "./MyReviews/MyReviews";

const ProfilePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: "",
        phone: "",
    });
    const [isEditing, setIsEditing] = useState(false);

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Address state
    const [addresses, setAddresses] = useState([]);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
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

    // Orders state
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedProductForReview, setSelectedProductForReview] = useState(null);

    // Fetch user profile
    const fetchProfile = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile`, {
                credentials: "include",
            });
            const data = await response.json();
            if (data.success) {
                setUser(data.data);
                setProfileForm({
                    name: data.data.name || "",
                    phone: data.data.phone || "",
                });
            } else {
                toast.error("Please login to view profile");
                navigate("/user-auth");
            }
        } catch (error) {
            toast.error("Failed to load profile");
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
            }
        } catch (error) {
            toast.error("Failed to load addresses");
        }
    };

    // Fetch orders
    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/my-orders`, {
                credentials: "include",
            });
            const data = await response.json();
            if (data.success) {
                setOrders(data.data);
            } else {
                toast.error(data.message || "Failed to fetch orders");
            }
        } catch (error) {
            console.error("Fetch orders error:", error);
            toast.error("Failed to load orders");
        } finally {
            setOrdersLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
        if (activeTab === "addresses") {
            fetchAddresses();
        }
        if (activeTab === "orders") {
            fetchOrders();
        }
    }, [activeTab]);

    // Handle profile update
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(profileForm),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Profile updated successfully");
                setUser(data.data);
                setIsEditing(false);
            } else {
                toast.error(data.message || "Update failed");
            }
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    // Handle password change
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/change-password`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Password changed successfully");
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                toast.error(data.message || "Failed to change password");
            }
        } catch (error) {
            toast.error("Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    // Handle add/edit address
    const handleAddressSubmit = async (e) => {
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
                setIsAddressModalOpen(false);
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
                fetchAddresses();
            } else {
                toast.error(data.message || "Failed to save address");
            }
        } catch (error) {
            toast.error("Failed to save address");
        } finally {
            setLoading(false);
        }
    };

    // Handle delete address
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
                fetchAddresses();
            } else {
                toast.error(data.message || "Failed to delete");
            }
        } catch (error) {
            toast.error("Failed to delete address");
        }
    };

    // Handle set default address
    const handleSetDefault = async (addressId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/address/set-default/${addressId}`, {
                method: "PUT",
                credentials: "include",
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Default address updated");
                fetchAddresses();
            } else {
                toast.error(data.message || "Failed to set default");
            }
        } catch (error) {
            toast.error("Failed to set default address");
        }
    };

    // Open edit address modal
    const openEditAddress = (address) => {
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
        setIsAddressModalOpen(true);
    };

    // View order details
    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    const handleWriteReview = (orderId, productId, variationId, productName, designName) => {
        setSelectedProductForReview({
            orderId,
            productId,
            variationId,
            productName,
            designName
        });
        setShowReviewModal(true);
    };

    // Refresh orders after cancel or review
    const refreshOrders = () => {
        fetchOrders();
    };

    // Menu items
    const menuItems = [
        { id: "profile", label: "Profile", icon: <FiUser /> },
        { id: "addresses", label: "Addresses", icon: <FiMapPin /> },
        { id: "password", label: "Change Password", icon: <FiLock /> },
        { id: "orders", label: "Orders", icon: <FiPackage /> },
        { id: "myreviews", label: "My Reviews", icon: <FiStar /> },

    ];

    // Right side content renderer
    const renderContent = () => {
        switch (activeTab) {
            case "profile":
                return (
                    <div className="pp__profile-content">
                        <div className="pp__content-header">
                            <h2>Profile Information</h2>
                            {!isEditing && (
                                <button className="pp__edit-btn" onClick={() => setIsEditing(true)}>
                                    <FiEdit2 /> Edit Profile
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleProfileUpdate} className="pp__profile-form">
                                <div className="pp__form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.name}
                                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="pp__form-group">
                                    <label>Email Address</label>
                                    <input type="email" value={user?.email || ""} disabled className="pp__disabled-input" />
                                    <small>Email cannot be changed</small>
                                </div>
                                <div className="pp__form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                    />
                                </div>
                                <div className="pp__form-actions">
                                    <button type="button" className="pp__cancel-btn" onClick={() => setIsEditing(false)}>
                                        <FiX /> Cancel
                                    </button>
                                    <button type="submit" className="pp__submit-btn" disabled={loading}>
                                        <FiCheck /> {loading ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="pp__profile-details">
                                <div className="pp__detail-row">
                                    <span className="pp__detail-label">Full Name:</span>
                                    <span className="pp__detail-value">{user?.name || "-"}</span>
                                </div>
                                <div className="pp__detail-row">
                                    <span className="pp__detail-label">Email Address:</span>
                                    <span className="pp__detail-value">{user?.email || "-"}</span>
                                </div>
                                <div className="pp__detail-row">
                                    <span className="pp__detail-label">Phone Number:</span>
                                    <span className="pp__detail-value">{user?.phone || "Not provided"}</span>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case "addresses":
                return (
                    <div className="pp__addresses-content">
                        <div className="pp__content-header">
                            <h2>My Addresses</h2>
                            <button className="pp__add-btn" onClick={() => {
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
                                    isDefault: addresses.length === 0,
                                });
                                setIsAddressModalOpen(true);
                            }}>
                                <FiPlus /> Add New Address
                            </button>
                        </div>

                        {addresses.length === 0 ? (
                            <div className="pp__empty-addresses">
                                <FiMapPin />
                                <p>No addresses saved yet</p>
                                <button onClick={() => setIsAddressModalOpen(true)}>Add your first address</button>
                            </div>
                        ) : (
                            <div className="pp__addresses-list">
                                {addresses.map((address) => (
                                    <div key={address._id} className={`pp__address-card ${address.isDefault ? "pp__address-card--default" : ""}`}>
                                        {address.isDefault && <span className="pp__default-badge">Default</span>}
                                        <div className="pp__address-details">
                                            <p className="pp__address-name">{address.fullName}</p>
                                            <p className="pp__address-phone">{address.phone}</p>
                                            <p className="pp__address-text">
                                                {address.addressLine1}<br />
                                                {address.addressLine2 && <>{address.addressLine2}<br /></>}
                                                {address.city}, {address.state} - {address.pincode}<br />
                                                {address.landmark && <>Landmark: {address.landmark}</>}
                                            </p>
                                            <p className="pp__address-type">{address.addressType}</p>
                                        </div>
                                        <div className="pp__address-actions">
                                            {!address.isDefault && (
                                                <button className="pp__default-address-btn" onClick={() => handleSetDefault(address._id)}>
                                                    Set as Default
                                                </button>
                                            )}
                                            <button className="pp__edit-address-btn" onClick={() => openEditAddress(address)}>
                                                <FiEdit2 />
                                            </button>
                                            <button className="pp__delete-address-btn" onClick={() => handleDeleteAddress(address._id)}>
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case "password":
                return (
                    <div className="pp__password-content">
                        <div className="pp__content-header">
                            <h2>Change Password</h2>
                        </div>

                        <form onSubmit={handlePasswordChange} className="pp__password-form">
                            <div className="pp__form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="pp__form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="pp__form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="pp__password-submit-btn" disabled={loading}>
                                {loading ? "Updating..." : "Update Password"}
                            </button>
                        </form>
                    </div>
                );

            case "orders":
                return (
                    <div className="pp__orders-content">
                        <div className="pp__content-header">
                            <h2>My Orders</h2>
                        </div>

                        {ordersLoading ? (
                            <div className="pp__orders-loading">
                                <div className="pp__spinner"></div>
                                <p>Loading orders...</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="pp__empty-orders">
                                <FiPackage />
                                <p>No orders yet</p>
                                <button onClick={() => navigate("/drinkware")}>Start Shopping</button>
                            </div>
                        ) : (
                            <div className="pp__orders-list">
                                {orders.map((order) => (
                                    <OrderCard
                                        key={order._id}
                                        order={order}
                                        onViewOrder={handleViewOrder}
                                        onWriteReview={handleWriteReview}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );



            case "myreviews":
                return <MyReviews />;

            default:
                return null;
        }
    };

    return (
        <div className="pp">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="pp__container">
                <h1 className="pp__title">My Account</h1>

                <div className="pp__layout">
                    {/* Left Sidebar */}
                    <div className="pp__sidebar">
                        <div className="pp__user-summary">
                            <div className="pp__user-avatar">
                                <FiUser />
                            </div>
                            <div className="pp__user-info">
                                <h3>{user?.name || "User"}</h3>
                                <p>{user?.email || "user@example.com"}</p>
                            </div>
                        </div>

                        <nav className="pp__sidebar-nav">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    className={`pp__nav-item ${activeTab === item.id ? "pp__nav-item--active" : ""}`}
                                    onClick={() => setActiveTab(item.id)}
                                >
                                    <span className="pp__nav-icon">{item.icon}</span>
                                    <span className="pp__nav-label">{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Right Content */}
                    <div className="pp__content-area">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* Address Modal */}
            {isAddressModalOpen && (
                <div className="pp__modal-overlay" onClick={() => setIsAddressModalOpen(false)}>
                    <div className="pp__modal pp__modal--address" onClick={(e) => e.stopPropagation()}>
                        <div className="pp__modal-header">
                            <h2>{editingAddress ? "Edit Address" : "Add New Address"}</h2>
                            <button className="pp__modal-close" onClick={() => setIsAddressModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleAddressSubmit} className="pp__address-form">
                            <div className="pp__form-row">
                                <div className="pp__form-group">
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={addressForm.fullName}
                                        onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="pp__form-group">
                                    <label>Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={addressForm.phone}
                                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pp__form-group">
                                <label>Address Line 1 *</label>
                                <input
                                    type="text"
                                    name="addressLine1"
                                    value={addressForm.addressLine1}
                                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="pp__form-group">
                                <label>Address Line 2 (Optional)</label>
                                <input
                                    type="text"
                                    name="addressLine2"
                                    value={addressForm.addressLine2}
                                    onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                                />
                            </div>

                            <div className="pp__form-row">
                                <div className="pp__form-group">
                                    <label>City *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={addressForm.city}
                                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="pp__form-group">
                                    <label>State *</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={addressForm.state}
                                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pp__form-row">
                                <div className="pp__form-group">
                                    <label>Pincode *</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={addressForm.pincode}
                                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="pp__form-group">
                                    <label>Landmark (Optional)</label>
                                    <input
                                        type="text"
                                        name="landmark"
                                        value={addressForm.landmark}
                                        onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pp__form-row">
                                <div className="pp__form-group">
                                    <label>Address Type</label>
                                    <select
                                        name="addressType"
                                        value={addressForm.addressType}
                                        onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}
                                    >
                                        <option value="home">Home</option>
                                        <option value="office">Office</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="pp__form-group pp__form-group--checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={addressForm.isDefault}
                                            onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                                        />
                                        Set as default address
                                    </label>
                                </div>
                            </div>

                            <div className="pp__modal-actions">
                                <button type="button" className="pp__cancel-btn" onClick={() => setIsAddressModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="pp__submit-btn" disabled={loading}>
                                    {loading ? "Saving..." : editingAddress ? "Update Address" : "Add Address"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {showOrderModal && selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setShowOrderModal(false)}
                    onWriteReview={handleWriteReview}
                    onCancelOrder={refreshOrders}
                />
            )}

            {/* Review Modal */}
            {showReviewModal && selectedProductForReview && (
                <ReviewModal
                    orderId={selectedProductForReview.orderId}
                    productId={selectedProductForReview.productId}
                    variationId={selectedProductForReview.variationId}
                    productName={selectedProductForReview.productName}
                    designName={selectedProductForReview.designName}
                    onClose={() => setShowReviewModal(false)}
                    onSuccess={refreshOrders}
                />
            )}
        </div>
    );
};

export default ProfilePage;