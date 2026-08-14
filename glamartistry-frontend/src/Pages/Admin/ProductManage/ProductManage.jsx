import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ProductManage.scss";

const ProductManage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [mainCategories, setMainCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [specsList, setSpecsList] = useState([]);

    // New states for variation type
    const [isVariationProduct, setIsVariationProduct] = useState(true);
    const [showConvertModal, setShowConvertModal] = useState(false);

    // Simple product state (for non-variation products)
    const [simpleProduct, setSimpleProduct] = useState({
        sellingPrice: "",
        originalPrice: "",
        images: []
    });
    const [simpleExistingImages, setSimpleExistingImages] = useState([]);
    const [simpleRemovedImages, setSimpleRemovedImages] = useState([]);

    const [formData, setFormData] = useState({
        name: "", description: "", mainCategory: "", subCategory: "", thumbnail: null,
    });
    const [variations, setVariations] = useState([]);
    const [currentVariation, setCurrentVariation] = useState({
        designName: "", sellingPrice: "", originalPrice: "", images: [],
    });
    const [editingVariationIndex, setEditingVariationIndex] = useState(null);
    const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);

    const fetchCategories = async () => {
        try {
            const [mainRes, subRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/categories/main/get-all`, { credentials: "include" }),
                fetch(`${import.meta.env.VITE_API_URL}/categories/sub/get-all`, { credentials: "include" })
            ]);
            const mainData = await mainRes.json();
            const subData = await subRes.json();
            if (mainData.success) setMainCategories(mainData.data);
            if (subData.success) setSubCategories(subData.data);
        } catch {
            toast.error("Failed to fetch categories");
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/products/get-all?page=${currentPage}&limit=10&search=${searchTerm}`,
                { credentials: "include" }
            );
            const data = await response.json();
            if (data.success) {
                setProducts(data.data);
                setTotalPages(data.pagination.totalPages);
            }
        } catch {
            toast.error("Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); fetchProducts(); }, [currentPage, searchTerm]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => setFormData({ ...formData, thumbnail: e.target.files[0] });

    const addSpecification = () => setSpecsList([...specsList, { key: "", value: "" }]);
    const removeSpecification = (index) => setSpecsList(specsList.filter((_, i) => i !== index));
    const updateSpecification = (index, field, value) => {
        const updated = [...specsList];
        updated[index][field] = value;
        setSpecsList(updated);
    };

    // Check if product is simple (non-variation) - 1 variation with designName "default"
    const isSimpleProduct = (productVariations) => {
        return productVariations?.length === 1 && productVariations[0]?.designName === "default";
    };

    const openModal = async (product = null) => {
        if (product) {
            setLoading(true);
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/products/get/${product.productId}`,
                    { credentials: "include" }
                );
                const data = await response.json();
                if (data.success) {
                    const fp = data.data;
                    setEditingProduct(fp);
                    setFormData({
                        name: fp.name || "",
                        description: fp.description || "",
                        mainCategory: fp.mainCategory || "",
                        subCategory: fp.subCategory || "",
                        thumbnail: null
                    });
                    setSpecsList(fp.specifications ? Object.entries(fp.specifications).map(([key, value]) => ({ key, value })) : []);

                    // Check if product is simple (non-variation)
                    const isSimple = isSimpleProduct(fp.variations);

                    if (isSimple) {
                        // Simple product mode
                        setIsVariationProduct(false);
                        const defaultVariation = fp.variations[0];
                        setSimpleProduct({
                            sellingPrice: defaultVariation.sellingPrice || "",
                            originalPrice: defaultVariation.originalPrice || "",
                            images: []
                        });
                        setSimpleExistingImages(defaultVariation.images || []);
                        setSimpleRemovedImages([]);
                        setVariations([]);
                    } else {
                        // Variation product mode
                        setIsVariationProduct(true);
                        setVariations(fp.variations?.map(v => ({
                            variationId: v.variationId,
                            designName: v.designName || "",
                            sellingPrice: v.sellingPrice || 0,
                            originalPrice: v.originalPrice || 0,
                            existingImages: v.images || [],
                            newImages: [],
                            removedImages: []
                        })) || []);
                        setSimpleProduct({ sellingPrice: "", originalPrice: "", images: [] });
                        setSimpleExistingImages([]);
                        setSimpleRemovedImages([]);
                    }

                    setIsModalOpen(true);
                } else toast.error("Failed to load product details");
            } catch { toast.error("Error loading product"); }
            finally { setLoading(false); }
        } else {
            setEditingProduct(null);
            setFormData({ name: "", description: "", mainCategory: "", subCategory: "", thumbnail: null });
            setVariations([]);
            setSpecsList([]);
            setIsVariationProduct(true);
            setSimpleProduct({ sellingPrice: "", originalPrice: "", images: [] });
            setSimpleExistingImages([]);
            setSimpleRemovedImages([]);
            setIsModalOpen(true);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setVariations([]);
        setSpecsList([]);
        setIsVariationProduct(true);
        setShowConvertModal(false);
        setSimpleProduct({ sellingPrice: "", originalPrice: "", images: [] });
        setSimpleExistingImages([]);
        setSimpleRemovedImages([]);
    };

    // Convert simple product to variation product
    const handleConvertToVariation = () => {
        setShowConvertModal(false);
        setIsVariationProduct(true);

        // Convert existing simple product data to first variation with EMPTY design name
        const firstVariation = {
            designName: "",  // EMPTY - user must fill
            sellingPrice: simpleProduct.sellingPrice || 0,
            originalPrice: simpleProduct.originalPrice || 0,
            existingImages: simpleExistingImages || [],
            newImages: [],
            removedImages: []
        };

        setVariations([firstVariation]);
        setSimpleProduct({ sellingPrice: "", originalPrice: "", images: [] });
        setSimpleExistingImages([]);
        setSimpleRemovedImages([]);

        toast.info("Now you can add variations. Please enter a design name for the existing product.");
    };

    const openVariationModal = (variation = null, index = null) => {
        if (variation) {
            setEditingVariationIndex(index);
            setCurrentVariation({
                variationId: variation.variationId,
                designName: variation.designName,
                sellingPrice: variation.sellingPrice,
                originalPrice: variation.originalPrice,
                images: [],
                existingImages: variation.existingImages || []
            });
        } else {
            setEditingVariationIndex(null);
            setCurrentVariation({
                variationId: undefined,
                designName: "",
                sellingPrice: "",
                originalPrice: "",
                images: [],
                existingImages: []
            });
        }
        setIsVariationModalOpen(true);
    };

    const closeVariationModal = () => {
        setIsVariationModalOpen(false);
        setEditingVariationIndex(null);
        setCurrentVariation({ designName: "", sellingPrice: "", originalPrice: "", images: [], existingImages: [] });
    };

    const handleVariationChange = (e) => setCurrentVariation({ ...currentVariation, [e.target.name]: e.target.value });
    const handleVariationImagesChange = (e) => setCurrentVariation({ ...currentVariation, images: Array.from(e.target.files) });
    const removeExistingImage = (idx) => setCurrentVariation({ ...currentVariation, existingImages: currentVariation.existingImages.filter((_, i) => i !== idx) });

    const handleSaveVariation = () => {
        if (!currentVariation.designName.trim()) return toast.error("Design name is required");
        if (!currentVariation.sellingPrice) return toast.error("Selling price is required");
        if (!currentVariation.originalPrice) return toast.error("Original price is required");

        const vData = {
            variationId: currentVariation.variationId,
            designName: currentVariation.designName,
            sellingPrice: Number(currentVariation.sellingPrice),
            originalPrice: Number(currentVariation.originalPrice),
            newImages: currentVariation.images || [],
            existingImages: currentVariation.existingImages || []
        };

        if (editingVariationIndex !== null) {
            const updated = [...variations];
            updated[editingVariationIndex] = vData;
            setVariations(updated);
            toast.success("Variation updated");
        } else {
            setVariations([...variations, vData]);
            toast.success("Variation added");
        }
        closeVariationModal();
    };

    const removeVariation = (index) => {
        setVariations(variations.filter((_, i) => i !== index));
        toast.success("Variation removed");
    };

    // Simple product image handlers
    const handleSimpleImagesChange = (e) => {
        setSimpleProduct({ ...simpleProduct, images: Array.from(e.target.files) });
    };

    const removeSimpleExistingImage = (idx) => {
        const removedImg = simpleExistingImages[idx];
        setSimpleExistingImages(simpleExistingImages.filter((_, i) => i !== idx));
        setSimpleRemovedImages([...simpleRemovedImages, removedImg]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error("Product name is required");
        if (!formData.description.trim()) return toast.error("Description is required");
        if (!formData.mainCategory) return toast.error("Main category is required");
        if (!formData.subCategory) return toast.error("Sub category is required");
        if (!editingProduct && !formData.thumbnail) return toast.error("Thumbnail is required");

        if (isVariationProduct) {
            if (variations.length === 0) return toast.error("At least one variation is required");
            const hasEmptyDesignName = variations.some(v => !v.designName.trim());
            if (hasEmptyDesignName) return toast.error("All variations must have a design name");
        } else {
            if (!simpleProduct.sellingPrice) return toast.error("Selling price is required");
            if (!simpleProduct.originalPrice) return toast.error("Original price is required");
        }

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("name", formData.name);
            fd.append("description", formData.description);
            fd.append("mainCategory", formData.mainCategory);
            fd.append("subCategory", formData.subCategory);

            const specsObject = {};
            specsList.forEach(s => { if (s.key && s.value) specsObject[s.key] = s.value; });
            fd.append("specifications", JSON.stringify(specsObject));
            if (formData.thumbnail) fd.append("thumbnail", formData.thumbnail);

            let variationsForBackend = [];

            if (isVariationProduct) {
                variationsForBackend = variations.map(v => ({
                    variationId: v.variationId || undefined,
                    designName: v.designName,
                    sellingPrice: v.sellingPrice,
                    originalPrice: v.originalPrice,
                    imagesCount: v.newImages?.length || 0,
                    newImagesCount: v.newImages?.length || 0,  // ✅ FIXED
                    existingImages: v.existingImages || []
                }));
                variations.forEach(v => {
                    if (v.newImages && v.newImages.length > 0) {
                        v.newImages.forEach(img => {
                            fd.append("variationImages", img);
                        });
                    }
                });
            } else {
                variationsForBackend = [{
                    designName: "default",
                    sellingPrice: Number(simpleProduct.sellingPrice),
                    originalPrice: Number(simpleProduct.originalPrice),
                    imagesCount: simpleProduct.images?.length || 0,
                    newImagesCount: simpleProduct.images?.length || 0,  // ✅ FIXED
                    existingImages: simpleExistingImages || []
                }];
                simpleProduct.images?.forEach(img => fd.append("variationImages", img));
            }

            fd.append("variations", JSON.stringify(variationsForBackend));

            if (editingProduct) {
                if (isVariationProduct) {
                    const removed = variations.flatMap(v => v.removedImages || []);
                    if (removed.length) fd.append("removedVariationImages", JSON.stringify(removed));
                } else {
                    if (simpleRemovedImages.length) fd.append("removedVariationImages", JSON.stringify(simpleRemovedImages));
                }
            }

            const url = editingProduct ? `${import.meta.env.VITE_API_URL}/products/update/${editingProduct.productId}` : `${import.meta.env.VITE_API_URL}/products/create`;
            const response = await fetch(url, { method: editingProduct ? "PUT" : "POST", body: fd, credentials: "include" });
            const data = await response.json();

            if (data.success) {
                toast.success(editingProduct ? "Product updated" : "Product created");
                closeModal();
                fetchProducts();
            } else {
                toast.error(data.message || "Something went wrong");
            }
        } catch {
            toast.error("Failed to save product");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm("Delete this product?")) return;
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/products/delete/${productId}`, { method: "DELETE", credentials: "include" });
            const data = await response.json();
            if (data.success) { toast.success("Product deleted"); fetchProducts(); }
            else toast.error(data.message || "Failed to delete");
        } catch { toast.error("Failed to delete product"); }
        finally { setLoading(false); }
    };

    const cap = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

    return (
        <div className="pm">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* HEADER */}
            <div className="pm__header">
                <h1>Product Management</h1>
                <button className="pm__add-btn" onClick={() => openModal()}>+ Add New Product</button>
            </div>

            {/* SEARCH */}
            <div className="pm__search-bar">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pm__search-input"
                />
            </div>

            {/* TABLE */}
            <div className="pm__table-wrapper">
                {loading && products.length === 0 ? (
                    <div className="pm__loading">Loading...</div>
                ) : products.length === 0 ? (
                    <div className="pm__empty">
                        <p>No products found</p>
                        <button className="pm__empty-btn" onClick={() => openModal()}>Create your first product</button>
                    </div>
                ) : (
                    <>
                        <table className="pm__table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Thumbnail</th>
                                    <th>Name</th>
                                    <th>Main Cat</th>
                                    <th>Sub Cat</th>
                                    <th>Variations</th>
                                    <th>Min Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.productId}>
                                        <td className="pm__id">{product.productId}</td>
                                        <td>
                                            <img src={product.thumbnail} alt={product.name} className="pm__thumb" />
                                        </td>
                                        <td className="pm__name">{product.name}</td>
                                        <td>{cap(product.mainCategory)}</td>
                                        <td>{cap(product.subCategory)}</td>
                                        <td>
                                            <span className="pm__badge">{product.variationsCount}</span>
                                        </td>
                                        <td className="pm__price">₹{product.minPrice}</td>
                                        <td>
                                            <div className="pm__actions">
                                                <button className="pm__edit-btn" onClick={() => openModal(product)}>Edit</button>
                                                <button className="pm__delete-btn" onClick={() => handleDelete(product.productId)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="pm__pagination">
                                <button className="pm__page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>← Previous</button>
                                <span className="pm__page-info">Page {currentPage} of {totalPages}</span>
                                <button className="pm__page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next →</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* PRODUCT MODAL */}
            {isModalOpen && (
                <div className="pm__overlay" onClick={closeModal}>
                    <div className="pm__modal" onClick={(e) => e.stopPropagation()}>
                        <div className="pm__modal-header">
                            <h2>{editingProduct ? "Edit Product" : "Create New Product"}</h2>
                            <button className="pm__close-btn" onClick={closeModal}>×</button>
                        </div>

                        <div className="pm__modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="pm__form-group">
                                    <label>Product Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter product name" required />
                                </div>

                                <div className="pm__form-group">
                                    <label>Description *</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter product description" rows="3" required />
                                </div>

                                <div className="pm__form-row">
                                    <div className="pm__form-group">
                                        <label>Main Category *</label>
                                        <select name="mainCategory" value={formData.mainCategory} onChange={handleChange} required>
                                            <option value="">Select Main Category</option>
                                            {mainCategories.map(cat => <option key={cat._id} value={cat.name}>{cap(cat.name)}</option>)}
                                        </select>
                                    </div>
                                    <div className="pm__form-group">
                                        <label>Sub Category *</label>
                                        <select name="subCategory" value={formData.subCategory} onChange={handleChange} required>
                                            <option value="">Select Sub Category</option>
                                            {subCategories.map(cat => <option key={cat._id} value={cat.name}>{cap(cat.name)}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* VARIATION TYPE RADIO BUTTONS - Only show in CREATE mode */}
                                {!editingProduct && (
                                    <div className="pm__variation-type">
                                        <label className="pm__variation-type-label">Product Type *</label>
                                        <div className="pm__radio-group">
                                            <label className="pm__radio-label">
                                                <input
                                                    type="radio"
                                                    value="yes"
                                                    checked={isVariationProduct === true}
                                                    onChange={() => setIsVariationProduct(true)}
                                                />
                                                <span>With Variations (Multiple designs, prices)</span>
                                            </label>
                                            <label className="pm__radio-label">
                                                <input
                                                    type="radio"
                                                    value="no"
                                                    checked={isVariationProduct === false}
                                                    onChange={() => setIsVariationProduct(false)}
                                                />
                                                <span>Simple Product (Single design, single price)</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* CONVERT BUTTON - Only show in EDIT mode for simple products */}
                                {editingProduct && !isVariationProduct && (
                                    <div className="pm__convert-section">
                                        <button
                                            type="button"
                                            className="pm__convert-btn"
                                            onClick={() => setShowConvertModal(true)}
                                        >
                                            Convert to Variation Product
                                        </button>
                                        <p className="pm__convert-note">
                                            Once converted to variation product, you cannot revert back to simple product.
                                        </p>
                                    </div>
                                )}

                                {/* SPECIFICATIONS */}
                                <div className="pm__specs">
                                    <div className="pm__specs-header">
                                        <label>Specifications</label>
                                        <button type="button" className="pm__spec-add-btn" onClick={addSpecification}>+ Add</button>
                                    </div>
                                    {specsList.length === 0 ? (
                                        <p className="pm__no-data">No specifications added</p>
                                    ) : (
                                        <div className="pm__specs-list">
                                            {specsList.map((spec, idx) => (
                                                <div key={idx} className="pm__spec-item">
                                                    <input type="text" placeholder="Key (e.g., Weight)" value={spec.key} onChange={(e) => updateSpecification(idx, "key", e.target.value)} />
                                                    <input type="text" placeholder="Value (e.g., 200g)" value={spec.value} onChange={(e) => updateSpecification(idx, "value", e.target.value)} />
                                                    <button type="button" className="pm__spec-remove-btn" onClick={() => removeSpecification(idx)}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* THUMBNAIL */}
                                <div className="pm__form-group">
                                    <label>Thumbnail Image {!editingProduct && "*"}</label>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="pm__file-input" />
                                    {editingProduct?.thumbnail && (
                                        <div className="pm__current-thumb">
                                            <img src={editingProduct.thumbnail} alt="Current thumbnail" />
                                            <span>Current thumbnail</span>
                                        </div>
                                    )}
                                </div>

                                {/* VARIATION PRODUCT SECTION */}
                                {isVariationProduct && (
                                    <div className="pm__variations">
                                        <div className="pm__variations-header">
                                            <label>Variations *</label>
                                            <button type="button" className="pm__var-add-btn" onClick={() => openVariationModal()}>+ Add Variation</button>
                                        </div>
                                        {variations.length === 0 ? (
                                            <p className="pm__no-data">No variations added yet</p>
                                        ) : (
                                            <div className="pm__variations-list">
                                                {variations.map((v, idx) => (
                                                    <div key={idx} className="pm__variation-item">
                                                        <div className="pm__variation-info">
                                                            <strong>{v.designName || "(No name)"}</strong>
                                                            <span>₹{v.sellingPrice} / <s>₹{v.originalPrice}</s></span>
                                                            <span className="pm__img-count">{(v.existingImages?.length || 0) + (v.newImages?.length || 0)} images</span>
                                                        </div>
                                                        <div className="pm__variation-actions">
                                                            <button type="button" className="pm__var-edit-btn" onClick={() => openVariationModal(v, idx)}>Edit</button>
                                                            <button type="button" className="pm__var-delete-btn" onClick={() => removeVariation(idx)}>Remove</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* SIMPLE PRODUCT SECTION */}
                                {!isVariationProduct && (
                                    <div className="pm__simple-product">
                                        <div className="pm__simple-header">
                                            <label>Product Pricing & Images *</label>
                                        </div>

                                        <div className="pm__form-row">
                                            <div className="pm__form-group">
                                                <label>Selling Price *</label>
                                                <input
                                                    type="number"
                                                    value={simpleProduct.sellingPrice}
                                                    onChange={(e) => setSimpleProduct({ ...simpleProduct, sellingPrice: e.target.value })}
                                                    placeholder="Enter selling price"
                                                    required
                                                />
                                            </div>
                                            <div className="pm__form-group">
                                                <label>Original Price *</label>
                                                <input
                                                    type="number"
                                                    value={simpleProduct.originalPrice}
                                                    onChange={(e) => setSimpleProduct({ ...simpleProduct, originalPrice: e.target.value })}
                                                    placeholder="Enter original price"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Existing Images for Simple Product */}
                                        {simpleExistingImages.length > 0 && (
                                            <div className="pm__form-group">
                                                <label>Current Images</label>
                                                <div className="pm__images-grid">
                                                    {simpleExistingImages.map((img, idx) => (
                                                        <div key={idx} className="pm__image-item">
                                                            <img src={img} alt={`product-img-${idx}`} />
                                                            <button type="button" className="pm__remove-img-btn" onClick={() => removeSimpleExistingImage(idx)}>×</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Add New Images for Simple Product */}
                                        <div className="pm__form-group">
                                            <label>Add Product Images</label>
                                            <input type="file" accept="image/*" multiple onChange={handleSimpleImagesChange} className="pm__file-input" />
                                            {simpleProduct.images?.length > 0 && (
                                                <div className="pm__selected-images">
                                                    <p>{simpleProduct.images.length} new image(s) selected</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pm__modal-actions">
                                    <button type="button" className="pm__cancel-btn" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="pm__submit-btn" disabled={loading}>
                                        {loading ? "Saving..." : editingProduct ? "Update" : "Create"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* VARIATION MODAL */}
            {isVariationModalOpen && (
                <div className="pm__overlay" onClick={closeVariationModal}>
                    <div className="pm__modal pm__modal--sm" onClick={(e) => e.stopPropagation()}>
                        <div className="pm__modal-header">
                            <h2>{editingVariationIndex !== null ? "Edit Variation" : "Add Variation"}</h2>
                            <button className="pm__close-btn" onClick={closeVariationModal}>×</button>
                        </div>

                        <div className="pm__modal-body">
                            <div className="pm__form-group">
                                <label>Design Name *</label>
                                <input type="text" name="designName" value={currentVariation.designName} onChange={handleVariationChange} placeholder="e.g., Stars, Diamond, Heart" required />
                            </div>

                            <div className="pm__form-row">
                                <div className="pm__form-group">
                                    <label>Selling Price *</label>
                                    <input type="number" name="sellingPrice" value={currentVariation.sellingPrice} onChange={handleVariationChange} placeholder="1200" />
                                </div>
                                <div className="pm__form-group">
                                    <label>Original Price *</label>
                                    <input type="number" name="originalPrice" value={currentVariation.originalPrice} onChange={handleVariationChange} placeholder="1800" />
                                </div>
                            </div>

                            {currentVariation.existingImages?.length > 0 && (
                                <div className="pm__form-group">
                                    <label>Current Images</label>
                                    <div className="pm__images-grid">
                                        {currentVariation.existingImages.map((img, idx) => (
                                            <div key={idx} className="pm__image-item">
                                                <img src={img} alt={`img-${idx}`} />
                                                <button type="button" className="pm__remove-img-btn" onClick={() => removeExistingImage(idx)}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pm__form-group">
                                <label>Add New Images</label>
                                <input type="file" accept="image/*" multiple onChange={handleVariationImagesChange} className="pm__file-input" />
                            </div>

                            <div className="pm__modal-actions">
                                <button type="button" className="pm__cancel-btn" onClick={closeVariationModal}>Cancel</button>
                                <button type="button" className="pm__submit-btn" onClick={handleSaveVariation}>
                                    {editingVariationIndex !== null ? "Update Variation" : "Add Variation"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CONVERT CONFIRMATION MODAL */}
            {showConvertModal && (
                <div className="pm__overlay" onClick={() => setShowConvertModal(false)}>
                    <div className="pm__modal pm__modal--sm" onClick={(e) => e.stopPropagation()}>
                        <div className="pm__modal-header">
                            <h2>Convert to Variation Product</h2>
                            <button className="pm__close-btn" onClick={() => setShowConvertModal(false)}>×</button>
                        </div>
                        <div className="pm__modal-body">
                            <div className="pm__convert-warning">
                                <p>⚠️ <strong>Warning!</strong></p>
                                <p>Once you convert this product to a variation product:</p>
                                <ul>
                                    <li>You will be able to add multiple variations</li>
                                    <li>You CANNOT revert back to a simple product</li>
                                    <li>The existing product will become a variation that you can customize</li>
                                </ul>
                                <p>Do you want to continue?</p>
                            </div>
                            <div className="pm__modal-actions">
                                <button type="button" className="pm__cancel-btn" onClick={() => setShowConvertModal(false)}>Cancel</button>
                                <button type="button" className="pm__submit-btn" onClick={handleConvertToVariation}>Yes, Convert</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManage;