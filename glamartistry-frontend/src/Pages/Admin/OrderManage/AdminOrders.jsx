import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FiSearch,
    FiFilter,
    FiEye,
    FiX,
    FiCheck,
    FiPackage,
    FiDollarSign,
    FiClock,
    FiDownload,
    FiChevronLeft,
    FiChevronRight,
} from "react-icons/fi";
import "./AdminOrders.scss";

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
    });

    const statusOptions = [
        { value: "all", label: "All Orders", color: "" },
        { value: "pending", label: "Pending", color: "pending" },
        { value: "confirmed", label: "Confirmed", color: "confirmed" },
        { value: "processing", label: "Processing", color: "processing" },
        { value: "shipped", label: "Shipped", color: "shipped" },
        { value: "delivered", label: "Delivered", color: "delivered" },
        { value: "cancelled", label: "Cancelled", color: "cancelled" },
    ];

    // Fetch orders
    const fetchOrders = async () => {
        setLoading(true);
        try {
            let url = `${import.meta.env.VITE_API_URL}/orders/admin/all?page=${currentPage}&limit=10`;
            if (statusFilter !== "all") {
                url += `&status=${statusFilter}`;
            }
            if (searchTerm) {
                url += `&search=${searchTerm}`;
            }

            const response = await fetch(url, {
                credentials: "include",
            });
            const data = await response.json();

            if (data.success) {
                setOrders(data.data);
                setTotalPages(data.pagination.totalPages);
            } else {
                toast.error(data.message || "Failed to fetch orders");
            }
        } catch (error) {
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    // Fetch statistics
    const fetchStats = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/admin/stats`, {
                credentials: "include",
            });
            const data = await response.json();

            if (data.success) {
                const statsData = data.data;
                setStats({
                    totalOrders: statsData.totalOrders || 0,
                    totalRevenue: statsData.totalRevenue || 0,
                    pendingOrders: statsData.byStatus?.find(s => s._id === "pending")?.count || 0,
                    deliveredOrders: statsData.byStatus?.find(s => s._id === "delivered")?.count || 0,
                });
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchStats();
    }, [currentPage, statusFilter, searchTerm]);

    // Update order status
    const handleUpdateStatus = async (orderId, newStatus) => {
        setUpdatingStatus(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/admin/update/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ orderStatus: newStatus }),
            });
            const data = await response.json();

            if (data.success) {
                toast.success(`Order status updated to ${newStatus}`);
                fetchOrders();
                fetchStats();
                if (selectedOrder && selectedOrder.orderId === orderId) {
                    setSelectedOrder(data.data);
                }
            } else {
                toast.error(data.message || "Failed to update status");
            }
        } catch (error) {
            toast.error("Failed to update order status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Cancel order - Open custom confirmation modal
    const handleCancelOrder = (orderId) => {
        setOrderToCancel(orderId);
        setShowCancelConfirm(true);
    };

    // Confirm cancel order
    const confirmCancelOrder = async () => {
        setShowCancelConfirm(false);
        setUpdatingStatus(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/admin/cancel/${orderToCancel}`, {
                method: "PUT",
                credentials: "include",
            });
            const data = await response.json();

            if (data.success) {
                toast.success("Order cancelled successfully");
                fetchOrders();
                fetchStats();
                if (selectedOrder && selectedOrder.orderId === orderToCancel) {
                    setSelectedOrder(data.data);
                }
            } else {
                toast.error(data.message || "Failed to cancel order");
            }
        } catch (error) {
            toast.error("Failed to cancel order");
        } finally {
            setUpdatingStatus(false);
            setOrderToCancel(null);
        }
    };

    // View order details
    const handleViewOrder = async (order) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Format price
    const formatPrice = (price) => `₹${price?.toFixed(2) || "0.00"}`;

    // Get status badge class
    const getStatusBadge = (status) => {
        const classes = {
            pending: "ao__status--pending",
            confirmed: "ao__status--confirmed",
            processing: "ao__status--processing",
            shipped: "ao__status--shipped",
            delivered: "ao__status--delivered",
            cancelled: "ao__status--cancelled",
        };
        return classes[status] || "ao__status--pending";
    };

    // Get status label
    const getStatusLabel = (status) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    // Check if cancel button should be shown (not delivered, not cancelled, not shipped)
    const canShowCancelButton = (status) => {
        return status !== "delivered" && status !== "cancelled" && status !== "shipped";
    };

    // Check if status select should be shown (not delivered, not cancelled)
    const canShowStatusSelect = (status) => {
        return status !== "delivered" && status !== "cancelled";
    };

    return (
        <div className="ao">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="ao__header">
                <h1>Order Management</h1>
            </div>

            {/* Statistics Cards */}
            <div className="ao__stats-grid">
                <div className="ao__stat-card">
                    <div className="ao__stat-icon ao__stat-icon--total">
                        <FiPackage />
                    </div>
                    <div className="ao__stat-info">
                        <h3>{stats.totalOrders}</h3>
                        <p>Total Orders</p>
                    </div>
                </div>
                <div className="ao__stat-card">
                    <div className="ao__stat-icon ao__stat-icon--revenue">
                        <FiDollarSign />
                    </div>
                    <div className="ao__stat-info">
                        <h3>{formatPrice(stats.totalRevenue)}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>
                <div className="ao__stat-card">
                    <div className="ao__stat-icon ao__stat-icon--pending">
                        <FiClock />
                    </div>
                    <div className="ao__stat-info">
                        <h3>{stats.pendingOrders}</h3>
                        <p>Pending Orders</p>
                    </div>
                </div>
                <div className="ao__stat-card">
                    <div className="ao__stat-icon ao__stat-icon--delivered">
                        <FiCheck />
                    </div>
                    <div className="ao__stat-info">
                        <h3>{stats.deliveredOrders}</h3>
                        <p>Delivered Orders</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="ao__filters">
                <div className="ao__search-box">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search by Order ID or Customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="ao__filter-box">
                    <FiFilter />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button className="ao__export-btn" onClick={() => toast.info("Export feature coming soon")}>
                    <FiDownload /> Export
                </button>
            </div>

            {/* Orders Table */}
            <div className="ao__table-wrapper">
                {loading ? (
                    <div className="ao__loading">
                        <div className="ao__spinner"></div>
                        <p>Loading orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="ao__empty">
                        <FiPackage />
                        <p>No orders found</p>
                    </div>
                ) : (
                    <div className="ao__table-responsive">
                        <table className="ao__table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order._id}>
                                        <td className="ao__order-id">{order.orderId}</td>
                                        <td className="ao__order-date">{formatDate(order.orderDate)}</td>
                                        <td>
                                            <div className="ao__customer-info">
                                                <strong>{order.shippingAddress?.fullName}</strong>
                                                <small>{order.userId?.email}</small>
                                            </div>
                                        </td>
                                        <td className="ao__order-item">{order.items?.length || 0} items</td>
                                        <td className="ao__total-price">{formatPrice(order.total)}</td>
                                        <td className="ao__order-payment">{order.paymentMethod === "cod" ? "COD" : "Online"}</td>
                                        <td>
                                            <span className={`ao__status-badge ${getStatusBadge(order.orderStatus)}`}>
                                                {getStatusLabel(order.orderStatus)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="ao__action-buttons">
                                                <button
                                                    className="ao__view-btn"
                                                    onClick={() => handleViewOrder(order)}
                                                    title="View Details"
                                                >
                                                    <FiEye />
                                                </button>
                                                {/* Status Select - Only for non-delivered, non-cancelled orders */}
                                                {canShowStatusSelect(order.orderStatus) && (
                                                    <select
                                                        className="ao__status-select"
                                                        value={order.orderStatus}
                                                        onChange={(e) => handleUpdateStatus(order.orderId, e.target.value)}
                                                        disabled={updatingStatus}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="confirmed">Confirmed</option>
                                                        <option value="processing">Processing</option>
                                                        <option value="shipped">Shipped</option>
                                                        <option value="delivered">Delivered</option>
                                                        {/* CANCEL option removed from dropdown */}
                                                    </select>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="ao__pagination">
                    <button
                        className="ao__page-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                    >
                        <FiChevronLeft /> Previous
                    </button>
                    <span className="ao__page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="ao__page-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                        Next <FiChevronRight />
                    </button>
                </div>
            )}

            {/* Order Details Modal */}
            {showDetailModal && selectedOrder && (
                <div className="ao__overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="ao__modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ao__modal-header">
                            <h2>Order Details</h2>
                            <button className="ao__close-btn" onClick={() => setShowDetailModal(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="ao__modal-body">
                            {/* Order Info */}
                            <div className="ao__info-section">
                                <h3>Order Information</h3>
                                <div className="ao__info-grid">
                                    <div className="ao__info-item">
                                        <span className="ao__info-label">Order ID:</span>
                                        <span className="ao__info-value">{selectedOrder.orderId}</span>
                                    </div>
                                    <div className="ao__info-item">
                                        <span className="ao__info-label">Order Date:</span>
                                        <span className="ao__info-value">{formatDate(selectedOrder.orderDate)}</span>
                                    </div>
                                    <div className="ao__info-item">
                                        <span className="ao__info-label">Status:</span>
                                        <span className={`ao__status-badge ${getStatusBadge(selectedOrder.orderStatus)}`}>
                                            {getStatusLabel(selectedOrder.orderStatus)}
                                        </span>
                                    </div>
                                    <div className="ao__info-item">
                                        <span className="ao__info-label">Payment Method:</span>
                                        <span className="ao__info-value">{selectedOrder.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</span>
                                    </div>
                                    <div className="ao__info-item">
                                        <span className="ao__info-label">Payment Status:</span>
                                        <span className="ao__info-value">{selectedOrder.paymentStatus}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="ao__info-section">
                                <h3>Customer Information</h3>
                                <div className="ao__info-grid">
                                    <div className="ao__info-item">
                                        <span className="ao__info-label">Name:</span>
                                        <span className="ao__info-value">{selectedOrder.shippingAddress?.fullName}</span>
                                    </div>
                                    <div className="ao__info-item">
                                        <span className="ao__info-label">Phone:</span>
                                        <span className="ao__info-value">{selectedOrder.shippingAddress?.phone}</span>
                                    </div>
                                    <div className="ao__info-item">
                                        <span className="ao__info-label">Email:</span>
                                        <span className="ao__info-value">{selectedOrder.userId?.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="ao__info-section">
                                <h3>Shipping Address</h3>
                                <div className="ao__address-box">
                                    <p>{selectedOrder.shippingAddress?.fullName}</p>
                                    <p>{selectedOrder.shippingAddress?.addressLine1}</p>
                                    {selectedOrder.shippingAddress?.addressLine2 && <p>{selectedOrder.shippingAddress?.addressLine2}</p>}
                                    <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}</p>
                                    <p>Phone: {selectedOrder.shippingAddress?.phone}</p>
                                    {selectedOrder.shippingAddress?.landmark && <p>Landmark: {selectedOrder.shippingAddress?.landmark}</p>}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="ao__info-section">
                                <h3>Order Items</h3>
                                <div className="ao__items-table-wrapper">
                                    <table className="ao__items-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Design</th>
                                                <th>Qty</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <div className="ao__product-info">
                                                            <img src={item.thumbnail} alt={item.productName} />
                                                            <span>{item.productName}</span>
                                                        </div>
                                                    </td>
                                                    <td>{item.designName}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{formatPrice(item.sellingPrice)}</td>
                                                    <td>{formatPrice(item.sellingPrice * item.quantity)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Price Summary */}
                            <div className="ao__info-section">
                                <h3>Price Summary</h3>
                                <div className="ao__price-summary">
                                    <div className="ao__summary-row">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(selectedOrder.subtotal)}</span>
                                    </div>
                                    {selectedOrder.savings > 0 && (
                                        <div className="ao__summary-row ao__summary-row--savings">
                                            <span>Savings</span>
                                            <span>- {formatPrice(selectedOrder.savings)}</span>
                                        </div>
                                    )}
                                    <div className="ao__summary-row">
                                        <span>Shipping</span>
                                        <span>{selectedOrder.shipping === 0 ? "Free" : formatPrice(selectedOrder.shipping)}</span>
                                    </div>
                                    <div className="ao__summary-row">
                                        <span>Tax</span>
                                        <span>{formatPrice(selectedOrder.tax)}</span>
                                    </div>
                                    <div className="ao__summary-divider"></div>
                                    <div className="ao__summary-row ao__summary-row--total">
                                        <span>Total</span>
                                        <span>{formatPrice(selectedOrder.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="ao__modal-footer">
                            {/* Status Update Select - Only for non-delivered, non-cancelled orders */}
                            {canShowStatusSelect(selectedOrder.orderStatus) && (
                                <>
                                    <select
                                        className="ao__status-update-select"
                                        value={selectedOrder.orderStatus}
                                        onChange={(e) => handleUpdateStatus(selectedOrder.orderId, e.target.value)}
                                        disabled={updatingStatus}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        {/* CANCEL option removed from dropdown */}
                                    </select>
                                    {/* Cancel Order Button - Only for non-shipped, non-delivered, non-cancelled orders */}
                                    {canShowCancelButton(selectedOrder.orderStatus) && (
                                        <button
                                            className="ao__cancel-order-btn"
                                            onClick={() => handleCancelOrder(selectedOrder.orderId)}
                                            disabled={updatingStatus}
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                </>
                            )}
                            <button className="ao__close-modal-btn" onClick={() => setShowDetailModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Cancel Order Confirmation Modal */}
            {showCancelConfirm && (
                <div className="ao__confirm-overlay" onClick={() => setShowCancelConfirm(false)}>
                    <div className="ao__confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ao__confirm-header">
                            <h3>Cancel Order</h3>
                            <button className="ao__confirm-close" onClick={() => setShowCancelConfirm(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="ao__confirm-body">
                            <p>Are you sure you want to cancel this order?</p>
                            <p className="ao__confirm-warning">This action cannot be undone.</p>
                        </div>
                        <div className="ao__confirm-actions">
                            <button className="ao__confirm-cancel" onClick={() => setShowCancelConfirm(false)}>
                                No, Go Back
                            </button>
                            <button className="ao__confirm-proceed" onClick={confirmCancelOrder}>
                                Yes, Cancel Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;