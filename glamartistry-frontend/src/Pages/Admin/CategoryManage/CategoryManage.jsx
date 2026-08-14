import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./CategoryManage.scss";

const CategoryManage = () => {
    const [activeTab, setActiveTab] = useState("main");
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        status: "active",
    });

    // Fetch categories based on active tab
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/categories/${activeTab}/get-all`,
                {
                    credentials: "include",
                }
            );
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            } else {
                toast.error(data.message || "Failed to fetch categories");
            }
        } catch (error) {
            toast.error("Failed to fetch categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [activeTab]);

    // Handle form input change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Open modal for create/edit
    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.displayName || category.name,
                status: category.status,
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: "", status: "active" });
        }
        setIsModalOpen(true);
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: "", status: "active" });
    };

    // Handle create/update
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Category name is required");
            return;
        }

        setLoading(true);
        try {
            let url = `${import.meta.env.VITE_API_URL}/categories/${activeTab}/create`;
            let method = "POST";

            if (editingCategory) {
                url = `${import.meta.env.VITE_API_URL}/categories/${activeTab}/update/${editingCategory._id}`;
                method = "PUT";
            }

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(editingCategory ? "Category updated successfully" : "Category created successfully");
                closeModal();
                fetchCategories();
            } else {
                toast.error(data.message || "Something went wrong");
            }
        } catch (error) {
            toast.error("Failed to save category");
        } finally {
            setLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this category?");
        if (!confirmDelete) return;

        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/categories/${activeTab}/delete/${id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            const data = await response.json();

            if (data.success) {
                toast.success("Category deleted successfully");
                fetchCategories();
            } else {
                toast.error(data.message || "Failed to delete");
            }
        } catch (error) {
            toast.error("Failed to delete category");
        } finally {
            setLoading(false);
        }
    };

    // Capitalize first letter for display
    const capitalizeFirst = (str) => {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    return (
        <div className="cm">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            {/* Header */}
            <div className="cm__header">
                <h1>Category Management</h1>
                <button className="cm__add-btn" onClick={() => openModal()}>
                    + Add New {activeTab === "main" ? "Main" : "Sub"} Category
                </button>
            </div>

            {/* Tabs */}
            <div className="cm__tabs">
                <button
                    className={`cm__tab-btn ${activeTab === "main" ? "cm__tab-btn--active" : ""}`}
                    onClick={() => setActiveTab("main")}
                >
                    Main Categories
                </button>
                <button
                    className={`cm__tab-btn ${activeTab === "sub" ? "cm__tab-btn--active" : ""}`}
                    onClick={() => setActiveTab("sub")}
                >
                    Sub Categories
                </button>
            </div>

            {/* Table */}
            <div className="cm__table-wrapper">
                {loading && categories.length === 0 ? (
                    <div className="cm__loading">Loading...</div>
                ) : categories.length === 0 ? (
                    <div className="cm__empty">
                        <p>No {activeTab} categories found</p>
                        <button className="cm__empty-btn" onClick={() => openModal()}>
                            Create your first {activeTab} category
                        </button>
                    </div>
                ) : (
                    <>
                        <table className="cm__table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((cat) => (
                                    <tr key={cat._id}>
                                        <td className="cm__name">{capitalizeFirst(cat.name)}</td>
                                        <td>
                                            <span className={`cm__status-badge cm__status-badge--${cat.status}`}>
                                                {cat.status === "active" ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="cm__date">{new Date(cat.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="cm__actions">
                                                <button className="cm__edit-btn" onClick={() => openModal(cat)}>
                                                    Edit
                                                </button>
                                                <button className="cm__delete-btn" onClick={() => handleDelete(cat._id)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="cm__overlay" onClick={closeModal}>
                    <div className="cm__modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cm__modal-header">
                            <h2>
                                {editingCategory
                                    ? `Edit ${activeTab === "main" ? "Main" : "Sub"} Category`
                                    : `Create New ${activeTab === "main" ? "Main" : "Sub"} Category`}
                            </h2>
                            <button className="cm__close-btn" onClick={closeModal}>×</button>
                        </div>

                        <div className="cm__modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="cm__form-group">
                                    <label>Category Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter category name"
                                        required
                                    />
                                </div>

                                <div className="cm__form-group">
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange}>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div className="cm__modal-actions">
                                    <button type="button" className="cm__cancel-btn" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="cm__submit-btn" disabled={loading}>
                                        {loading ? "Saving..." : editingCategory ? "Update" : "Create"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManage;