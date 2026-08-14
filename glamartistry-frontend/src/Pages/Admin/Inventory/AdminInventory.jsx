import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FiSearch,
    FiFilter,
    FiEdit2,
    FiClock,
    FiAlertCircle,
    FiRefreshCw,
    FiChevronLeft,
    FiChevronRight,
    FiX
} from "react-icons/fi";
import "./AdminInventory.scss";

const AdminInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [filteredInventory, setFilteredInventory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedInventory, setSelectedInventory] = useState(null);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [stockHistory, setStockHistory] = useState(null);
    const [stockForm, setStockForm] = useState({
        quantity: "",
        newStock: "",
        reason: "admin_update",
        note: "",
    });

    // Fetch inventory
    const fetchInventory = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/inventory/get-all`, {
                credentials: "include",
            });
            const data = await response.json();
            if (data.success) {
                setInventory(data.data);
                setFilteredInventory(data.data);
            } else {
                toast.error(data.message || "Failed to fetch inventory");
            }
        } catch (error) {
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    // Filter inventory
    useEffect(() => {
        let filtered = [...inventory];

        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.designName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterLowStock) {
            filtered = filtered.filter(item => item.stock <= item.lowStockThreshold);
        }

        setFilteredInventory(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterLowStock, inventory]);

    // Pagination
    const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentInventory = filteredInventory.slice(startIndex, startIndex + itemsPerPage);

    // Update stock
    const handleUpdateStock = async (e) => {
        e.preventDefault();

        const { quantity, newStock, reason, note } = stockForm;

        if (!quantity && !newStock) {
            toast.error("Either quantity or new stock value is required");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/inventory/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    inventoryId: selectedInventory.inventoryId,
                    quantity: quantity ? parseInt(quantity) : undefined,
                    newStock: newStock ? parseInt(newStock) : undefined,
                    reason,
                    note,
                }),
            });
            const data = await response.json();

            if (data.success) {
                toast.success("Stock updated successfully");
                setShowStockModal(false);
                setStockForm({ quantity: "", newStock: "", reason: "admin_update", note: "" });
                fetchInventory();
            } else {
                toast.error(data.message || "Failed to update stock");
            }
        } catch (error) {
            toast.error("Failed to update stock");
        } finally {
            setLoading(false);
        }
    };

    // View stock history
    const handleViewHistory = async (inventoryItem) => {
        setSelectedInventory(inventoryItem);
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/inventory/history/${inventoryItem.inventoryId}`, {
                credentials: "include",
            });
            const data = await response.json();
            if (data.success) {
                setStockHistory(data.data);
                setShowHistoryModal(true);
            } else {
                toast.error(data.message || "Failed to fetch history");
            }
        } catch (error) {
            toast.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    // Open stock modal
    const openStockModal = (item) => {
        setSelectedInventory(item);
        setStockForm({ quantity: "", newStock: "", reason: "admin_update", note: "" });
        setShowStockModal(true);
    };

    // Get low stock warning
    const getStockWarning = (stock, threshold) => {
        if (stock <= threshold) {
            return { class: "ai__stock--low", message: "Low Stock!" };
        }
        return { class: "", message: "" };
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get reason badge
    const getReasonBadge = (reason) => {
        const badges = {
            admin_update: { class: "ai__badge--admin", label: "Admin Update" },
            order_placed: { class: "ai__badge--order", label: "Order Placed" },
            order_cancelled: { class: "ai__badge--cancel", label: "Order Cancelled" },
            stock_reset: { class: "ai__badge--reset", label: "Stock Reset" },
            return: { class: "ai__badge--return", label: "Return" },
        };
        return badges[reason] || { class: "ai__badge--admin", label: "Update" };
    };

    return (
        <div className="ai">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="ai__header">
                <h1>Inventory Management</h1>
                <button className="ai__refresh-btn" onClick={fetchInventory}>
                    <FiRefreshCw /> Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="ai__filters">
                <div className="ai__search-box">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search by product or design..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="ai__filter-box">
                    <FiFilter />
                    <label className="ai__checkbox-label">
                        <input
                            type="checkbox"
                            checked={filterLowStock}
                            onChange={(e) => setFilterLowStock(e.target.checked)}
                        />
                        Show Low Stock Only
                    </label>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="ai__table-wrapper">
                {loading ? (
                    <div className="ai__loading">
                        <div className="ai__spinner"></div>
                        <p>Loading inventory...</p>
                    </div>
                ) : currentInventory.length === 0 ? (
                    <div className="ai__empty">
                        <FiAlertCircle />
                        <p>No inventory items found</p>
                    </div>
                ) : (
                    <table className="ai__table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Variation</th>
                                <th>Stock</th>
                                <th>Threshold</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const grouped = {};
                                currentInventory.forEach(item => {
                                    if (!grouped[item.productId]) {
                                        grouped[item.productId] = {
                                            productName: item.productName,
                                            thumbnail: item.productThumbnail,
                                            variations: [],
                                        };
                                    }
                                    grouped[item.productId].variations.push(item);
                                });

                                return Object.values(grouped).map((group, idx) => (
                                    <React.Fragment key={idx}>
                                        <tr className="ai__product-row">
                                            <td colSpan="6">
                                                <div className="ai__product-info">
                                                    <img
                                                        src={group.thumbnail}
                                                        alt={group.productName}
                                                        className="ai__product-thumb"
                                                        onError={(e) => e.target.src = "https://via.placeholder.com/40x40?text=No+Image"}
                                                    />
                                                    <span className="ai__product-name">{group.productName}</span>
                                                </div>
                                            </td>
                                        </tr>
                                        {group.variations.map((item) => {
                                            const warning = getStockWarning(item.stock, item.lowStockThreshold);
                                            return (
                                                <tr key={item.inventoryId} className="ai__variation-row">
                                                    <td></td>
                                                    <td className="ai__variation-name">{item.designName || "Default"}</td>
                                                    <td className={`ai__stock ${warning.class}`}>
                                                        {item.stock}
                                                        {warning.message && (
                                                            <span className="ai__warning-icon">
                                                                <FiAlertCircle />
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>{item.lowStockThreshold}</td>
                                                    <td>
                                                        {item.stock <= item.lowStockThreshold ? (
                                                            <span className="ai__status-badge ai__status-badge--critical">Critical</span>
                                                        ) : item.stock <= item.lowStockThreshold * 2 ? (
                                                            <span className="ai__status-badge ai__status-badge--low">Low</span>
                                                        ) : (
                                                            <span className="ai__status-badge ai__status-badge--good">Good</span>
                                                        )}
                                                    </td>
                                                    <td className="ai__actions">
                                                        <button
                                                            className="ai__action-btn ai__action-btn--update"
                                                            onClick={() => openStockModal(item)}
                                                            title="Update Stock"
                                                        >
                                                            <FiEdit2 />
                                                        </button>
                                                        <button
                                                            className="ai__action-btn ai__action-btn--history"
                                                            onClick={() => handleViewHistory(item)}
                                                            title="View History"
                                                        >
                                                            <FiClock />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ));
                            })()}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="ai__pagination">
                    <button
                        className="ai__page-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                        <FiChevronLeft /> Previous
                    </button>
                    <span className="ai__page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="ai__page-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                        Next <FiChevronRight />
                    </button>
                </div>
            )}

            {/* Stock Update Modal */}
            {showStockModal && selectedInventory && (
                <div className="ai__overlay" onClick={() => setShowStockModal(false)}>
                    <div className="ai__modal ai__modal--stock" onClick={(e) => e.stopPropagation()}>
                        <div className="ai__modal-header">
                            <h2>Update Stock</h2>
                            <button className="ai__close-btn" onClick={() => setShowStockModal(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="ai__modal-body">
                            <div className="ai__info-row">
                                <span className="ai__info-label">Product:</span>
                                <span className="ai__info-value">{selectedInventory.productName}</span>
                            </div>
                            <div className="ai__info-row">
                                <span className="ai__info-label">Variation:</span>
                                <span className="ai__info-value">{selectedInventory.designName || "Default"}</span>
                            </div>
                            <div className="ai__info-row">
                                <span className="ai__info-label">Current Stock:</span>
                                <span className="ai__info-value">{selectedInventory.stock}</span>
                            </div>
                            <div className="ai__info-row">
                                <span className="ai__info-label">Threshold:</span>
                                <span className="ai__info-value">{selectedInventory.lowStockThreshold}</span>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateStock} className="ai__form">
                            <div className="ai__form-group">
                                <label>Add/Remove Quantity</label>
                                <input
                                    type="number"
                                    value={stockForm.quantity}
                                    onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                                    placeholder="e.g., +10 or -5"
                                />
                                <small>Positive number to add, negative to remove</small>
                            </div>

                            <div className="ai__form-group">
                                <label>OR Set Exact Stock</label>
                                <input
                                    type="number"
                                    value={stockForm.newStock}
                                    onChange={(e) => setStockForm({ ...stockForm, newStock: e.target.value })}
                                    placeholder="e.g., 50"
                                />
                            </div>

                            <div className="ai__form-group">
                                <label>Reason *</label>
                                <select
                                    value={stockForm.reason}
                                    onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                                    required
                                >
                                    <option value="admin_update">Admin Update</option>
                                    <option value="stock_reset">Stock Reset</option>
                                    <option value="return">Return</option>
                                </select>
                            </div>

                            <div className="ai__form-group">
                                <label>Note (Optional)</label>
                                <textarea
                                    value={stockForm.note}
                                    onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })}
                                    placeholder="Add a note about this stock update..."
                                    rows="2"
                                />
                            </div>

                            <div className="ai__modal-actions">
                                <button type="button" className="ai__cancel-btn" onClick={() => setShowStockModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="ai__submit-btn" disabled={loading}>
                                    {loading ? "Updating..." : "Update Stock"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock History Modal */}
            {showHistoryModal && stockHistory && selectedInventory && (
                <div className="ai__overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="ai__modal ai__modal--history" onClick={(e) => e.stopPropagation()}>
                        <div className="ai__modal-header">
                            <h2>Stock History - {selectedInventory.productName}</h2>
                            <button className="ai__close-btn" onClick={() => setShowHistoryModal(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="ai__modal-body">
                            <div className="ai__info-row">
                                <span className="ai__info-label">Variation:</span>
                                <span className="ai__info-value">{selectedInventory.designName || "Default"}</span>
                            </div>
                            <div className="ai__info-row">
                                <span className="ai__info-label">Current Stock:</span>
                                <span className="ai__info-value">{selectedInventory.stock}</span>
                            </div>
                        </div>

                        {stockHistory.history && stockHistory.history.length === 0 ? (
                            <div className="ai__empty-history">
                                <p>No stock history available</p>
                            </div>
                        ) : (
                            <div className="ai__history-list">
                                <table className="ai__history-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Old Stock</th>
                                            <th>New Stock</th>
                                            <th>Change</th>
                                            <th>Reason</th>
                                            <th>Changed By</th>
                                            <th>Note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stockHistory.history?.map((entry, idx) => {
                                            const change = entry.newStock - entry.oldStock;
                                            const reasonBadge = getReasonBadge(entry.reason);
                                            return (
                                                <tr key={entry.historyId || idx}>
                                                    <td>{formatDate(entry.createdAt)}</td>
                                                    <td>{entry.oldStock}</td>
                                                    <td>{entry.newStock}</td>
                                                    <td className={change > 0 ? "ai__change-positive" : change < 0 ? "ai__change-negative" : ""}>
                                                        {change > 0 ? `+${change}` : change}
                                                    </td>
                                                    <td>
                                                        <span className={`ai__reason-badge ${reasonBadge.class}`}>
                                                            {reasonBadge.label}
                                                        </span>
                                                    </td>
                                                    <td>{entry.changedBy}</td>
                                                    <td className="ai__note-cell">{entry.note || "-"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventory;