import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiShoppingCart, FiChevronLeft, FiZap } from "react-icons/fi";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, Autoplay } from "swiper/modules";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "./ProductPage.scss";
import CartSidebar from "../Cart/CartSidebar";
import ProductReviewModal from "./ProductReviewModal/ProductReviewModal";
import RelatedProducts from "./RelatedProducts/RelatedProducts";

gsap.registerPlugin(ScrollTrigger);

const ProductPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();

    const sectionRef = useRef(null);
    const rightColumnRef = useRef(null);
    const leftColumnRef = useRef(null);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Inventory state
    const [inventoryData, setInventoryData] = useState(null);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [showCartSidebar, setShowCartSidebar] = useState(false);

    // Review state
    const [reviewData, setReviewData] = useState({
        averageRating: 0,
        totalReviews: 0,
        reviews: []
    });
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    // Fetch product data
    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/products/get/${productId}`, {
                    credentials: "include",
                });
                const data = await response.json();
                if (data.success) {
                    setProduct(data.data);
                    if (data.data.variations && data.data.variations.length > 0) {
                        setSelectedVariation(data.data.variations[0]);
                        fetchInventory(data.data.variations[0].variationId);
                    }
                } else {
                    setError(data.message);
                }
            } catch (err) {
                setError("Failed to load product");
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    // Fetch inventory when variation changes
    const fetchInventory = async (variationId) => {
        if (!variationId) return;
        setInventoryLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/inventory/status/${productId}/${variationId}`
            );
            const data = await response.json();
            if (data.success) {
                setInventoryData(data.data);
                if (data.data.stock > 0 && quantity > data.data.stock) {
                    setQuantity(data.data.stock);
                }
                if (data.data.stock === 0) {
                    setQuantity(0);
                }
                if (data.data.stock > 0 && quantity === 0) {
                    setQuantity(1);
                }
            }
        } catch (err) {
            console.error("Inventory fetch error:", err);
            setInventoryData(null);
        } finally {
            setInventoryLoading(false);
        }
    };

    // Fetch product reviews
    const fetchProductReviews = async () => {
        if (!selectedVariation?.variationId) return;

        setReviewsLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/reviews/product/${productId}/${selectedVariation.variationId}`,
                { credentials: "include" }
            );
            const data = await response.json();

            if (data.success) {
                setReviewData({
                    averageRating: data.averageRating || 0,
                    totalReviews: data.totalReviews || 0,
                    reviews: data.data || []
                });
            }
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setReviewsLoading(false);
        }
    };

    // Check wishlist status
    useEffect(() => {
        const checkWishlist = async () => {
            if (!selectedVariation) return;
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/wishlist/check/${productId}/${selectedVariation.variationId}`,
                    { credentials: "include" }
                );
                const data = await response.json();
                setIsInWishlist(data.inWishlist);
            } catch (err) {
                console.error("Wishlist check failed:", err);
            }
        };

        if (productId && selectedVariation) {
            checkWishlist();
        }
    }, [productId, selectedVariation]);

    // Fetch reviews when variation is selected initially
    useEffect(() => {
        if (selectedVariation?.variationId) {
            fetchProductReviews();
        }
    }, [selectedVariation]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Handle variation change
    const handleVariationChange = (variation) => {
        setSelectedVariation(variation);
        fetchInventory(variation.variationId);
        fetchProductReviews();
    };

    // Stock helpers
    const maxStock = inventoryData?.stock || 0;
    const isInStock = inventoryData?.inStock || false;
    const stockStatus = inventoryData?.status || "checking";
    const isLowStock = stockStatus === "low-stock";

    // Variables
    const cheapestVar = product?.variations?.length > 0
        ? product.variations.reduce((min, curr) =>
            curr.sellingPrice < min.sellingPrice ? curr : min
            , product.variations[0])
        : null;

    const displayPrice = selectedVariation?.sellingPrice || cheapestVar?.sellingPrice || 0;
    const displayOriginal = selectedVariation?.originalPrice || cheapestVar?.originalPrice || 0;
    const discountPercent = displayOriginal > displayPrice
        ? Math.round(((displayOriginal - displayPrice) / displayOriginal) * 100)
        : 0;
    const totalPrice = displayPrice * quantity;
    const hasDiscount = discountPercent > 0;

    const allImages = selectedVariation?.images?.length > 0
        ? selectedVariation.images
        : product?.thumbnail ? [product.thumbnail] : [];

    const allVariations = product?.variations || [];

    // GSAP ScrollTrigger
    useEffect(() => {
        if (loading || !product) return;
        if (window.innerWidth < 1024) return;

        ScrollTrigger.getAll().forEach(t => t.kill());

        const timeoutId = setTimeout(() => {
            if (sectionRef.current && rightColumnRef.current) {
                ScrollTrigger.create({
                    trigger: sectionRef.current,
                    start: "top top",
                    end: "bottom bottom",
                    pin: rightColumnRef.current,
                    pinSpacing: true,
                    invalidateOnRefresh: true,
                });
            }
        }, 300);

        return () => {
            clearTimeout(timeoutId);
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, [loading, product, allImages]);

    // Refresh ScrollTrigger
    useEffect(() => {
        if (!loading && allImages.length > 0) {
            setTimeout(() => ScrollTrigger.refresh(), 500);
        }
    }, [loading, allImages]);

    const formatPrice = (price) => `₹${price?.toFixed(2) || "0.00"}`;

    // Quantity handler with stock limit
    const handleQuantityChange = (delta) => {
        if (!isInStock) return;

        const newQty = quantity + delta;
        if (newQty >= 1 && newQty <= maxStock) {
            setQuantity(newQty);
        }
    };

    // Can purchase check
    const canPurchase = isInStock && quantity > 0 && quantity <= maxStock;

    const handleAddToCart = async () => {
        if (!selectedVariation) {
            toast.error("Please select a variation");
            return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/cart/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                productId: product.productId,
                variationId: selectedVariation.variationId,
                quantity: quantity,
                designName: selectedVariation.designName,
            }),
        });

        const data = await response.json();
        if (data.success) {
            toast.success(`Added ${quantity} × ${product.name} to cart`);
            setShowCartSidebar(true);
            window.dispatchEvent(new Event('cartUpdated'));
        } else {
            toast.error(data.message || "Failed to add to cart");
        }
    };

    const handleBuyNow = () => {
        if (!selectedVariation) {
            toast.error("Please select a variation");
            return;
        }

        navigate("/checkout", {
            state: {
                buyNowMode: true,
                product: {
                    productId: product.productId,
                    variationId: selectedVariation.variationId,
                    designName: selectedVariation.designName,
                    quantity: quantity,
                    productName: product.name,
                    thumbnail: selectedVariation.images?.[0] || product.thumbnail,
                    sellingPrice: selectedVariation.sellingPrice,
                    originalPrice: selectedVariation.originalPrice,
                    subCategory: product.subCategory,
                }
            }
        });
    };

    const toggleWishlist = async () => {
        if (!selectedVariation) return;
        if (isInWishlist) {
            try {
                await fetch(
                    `${import.meta.env.VITE_API_URL}/wishlist/remove/${productId}/${selectedVariation.variationId}`,
                    { method: "DELETE", credentials: "include" }
                );
                setIsInWishlist(false);
                toast.success("Removed from wishlist");
            } catch (err) {
                toast.error("Failed to remove from wishlist");
            }
        } else {
            try {
                await fetch(`${import.meta.env.VITE_API_URL}/wishlist/add`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        productId,
                        variationId: selectedVariation.variationId,
                    }),
                });
                setIsInWishlist(true);
                toast.success("Added to wishlist");
            } catch (err) {
                toast.error("Failed to add to wishlist");
            }
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="product-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading product...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !product) {
        return (
            <div className="product-page">
                <div className="error-container">
                    <h2>{error || "Product not found"}</h2>
                    <button onClick={() => navigate("/drinkware")}>Back to Shop</button>
                </div>
            </div>
        );
    }

    return (
        <div className="product-page">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="back-button-container">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <FiChevronLeft /> Back
                </button>
            </div>

            <section className="product-scroll-section" ref={sectionRef}>
                <div className="product-grid-wrapper">
                    <div className="product-left-column" ref={leftColumnRef}>
                        <div className="desktop-image-grid">
                            {allImages.map((img, idx) => (
                                <div key={idx} className="image-grid-item">
                                    <img
                                        src={img}
                                        alt={`${product.name} - ${idx + 1}`}
                                        onError={(e) => e.target.src = "https://via.placeholder.com/400x400?text=No+Image"}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mobile-image-slider">
                            <Swiper
                                spaceBetween={10}
                                slidesPerView={1}
                                navigation={!isMobile}
                                autoplay={{ delay: 4000, disableOnInteraction: false }}
                                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                                modules={[Navigation, Autoplay, Thumbs]}
                                className="main-swiper"
                            >
                                {allImages.map((img, idx) => (
                                    <SwiperSlide key={idx}>
                                        <div className="swiper-image-container">
                                            <img
                                                src={img}
                                                alt={`${product.name} - ${idx + 1}`}
                                                onError={(e) => e.target.src = "https://via.placeholder.com/400x400?text=No+Image"}
                                            />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {allImages.length > 1 && (
                                <Swiper
                                    onSwiper={setThumbsSwiper}
                                    spaceBetween={8}
                                    slidesPerView={Math.min(4, allImages.length)}
                                    watchSlidesProgress={true}
                                    modules={[Thumbs]}
                                    className="thumbnail-swiper"
                                >
                                    {allImages.map((img, idx) => (
                                        <SwiperSlide key={idx}>
                                            <div className="thumbnail-item">
                                                <img
                                                    src={img}
                                                    alt={`Thumb ${idx + 1}`}
                                                    onError={(e) => e.target.src = "https://via.placeholder.com/80x80?text=No+Image"}
                                                />
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            )}
                        </div>
                    </div>

                    <div className="product-right-column" ref={rightColumnRef}>
                        <div className="best-seller-badge">BEST SELLER</div>
                        <h1 className="product-title">{product.name}</h1>
                        <p className="product-category">{product.subCategory}</p>

                        {/* Reviews Row - CLICKABLE */}
                        <div
                            className="reviews-row reviews-row--clickable"
                            onClick={() => setShowReviewModal(true)}
                        >
                            <div className="stars-container">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={`star ${star <= Math.round(reviewData.averageRating) ? "star--filled" : ""}`}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span className="reviews-count">
                                ({reviewData.totalReviews} {reviewData.totalReviews === 1 ? "review" : "reviews"})
                            </span>
                            {reviewsLoading && <span className="reviews-loading">Loading...</span>}
                        </div>

                        <div className="price-section">
                            <div className="price-row">
                                <span className="current-price">{formatPrice(displayPrice)}</span>
                                {hasDiscount && (
                                    <>
                                        <span className="original-price">{formatPrice(displayOriginal)}</span>
                                        <span className="discount-badge">{discountPercent}% OFF</span>
                                    </>
                                )}
                            </div>
                            {hasDiscount && (
                                <div className="savings-info">
                                    You save {formatPrice(displayOriginal - displayPrice)}
                                </div>
                            )}
                        </div>

                        {/* Stock Status Display */}
                        <div className={`stock-status ${stockStatus}`}>
                            {inventoryLoading ? (
                                <span className="stock-checking">⏳ Checking stock...</span>
                            ) : stockStatus === "out-of-stock" ? (
                                <span className="stock-out">❌ Out of Stock</span>
                            ) : stockStatus === "low-stock" ? (
                                <span className="stock-low">⚠️ Only {maxStock} left in stock!</span>
                            ) : stockStatus === "in-stock" ? (
                                <span className="stock-in">✅ In Stock ({maxStock} available)</span>
                            ) : (
                                <span className="stock-checking">⏳ Checking stock...</span>
                            )}
                        </div>

                        {allVariations.length > 1 && (
                            <div className="variation-section">
                                <h3>Select Design</h3>
                                <div className="variation-grid">
                                    {allVariations.map((variation) => (
                                        <button
                                            key={variation.variationId}
                                            className={`variation-btn ${selectedVariation?.variationId === variation.variationId ? "active" : ""}`}
                                            onClick={() => handleVariationChange(variation)}
                                        >
                                            {variation.designName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="quantity-section">
                            <h3>Quantity</h3>
                            <div className="quantity-selector">
                                <button
                                    className="qty-btn"
                                    onClick={() => handleQuantityChange(-1)}
                                    disabled={!isInStock || quantity <= 1}
                                >
                                    -
                                </button>
                                <span className="qty-value">{isInStock ? quantity : 0}</span>
                                <button
                                    className="qty-btn"
                                    onClick={() => handleQuantityChange(1)}
                                    disabled={!isInStock || quantity >= maxStock}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="action-buttons">
                            <button
                                className={`add-to-cart-btn ${!canPurchase ? "disabled" : ""}`}
                                onClick={handleAddToCart}
                                disabled={!canPurchase}
                            >
                                <FiShoppingCart />
                                {!isInStock ? "Out of Stock" : "Add to Cart"}
                            </button>
                            <button
                                className={`buy-now-btn ${!canPurchase ? "disabled" : ""}`}
                                onClick={handleBuyNow}
                                disabled={!canPurchase}
                            >
                                <FiZap />
                                {!isInStock ? "Out of Stock" : "Buy Now"}
                            </button>
                            <button
                                className={`wishlist-btn ${isInWishlist ? "active" : ""}`}
                                onClick={toggleWishlist}
                            >
                                {isInWishlist ? <FaHeart /> : <FaRegHeart />}
                                <span>{isInWishlist ? "Saved" : "Save"}</span>
                            </button>
                        </div>

                        <div className="description-section">
                            <h3>Description</h3>
                            <p>{product.description || "No description available."}</p>
                        </div>

                        {product.specifications && Object.keys(product.specifications).length > 0 && (
                            <div className="specifications-section">
                                <h3>Specifications</h3>
                                <div className="spec-grid">
                                    {Object.entries(product.specifications).map(([key, value]) => (
                                        <div key={key} className="spec-row">
                                            <span className="spec-key">{key}</span>
                                            <span className="spec-value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Related Products */}
            <RelatedProducts
                currentProductId={product.productId}
                mainCategory={product.mainCategory}
                subCategory={product.subCategory}
            />

            <CartSidebar isOpen={showCartSidebar} onClose={() => setShowCartSidebar(false)} />

            {/* Review Modal */}
            {showReviewModal && (
                <ProductReviewModal
                    reviews={reviewData.reviews}
                    averageRating={reviewData.averageRating}
                    totalReviews={reviewData.totalReviews}
                    productName={product.name}
                    variationName={selectedVariation?.designName}
                    onClose={() => setShowReviewModal(false)}
                />
            )}
        </div>
    );
};

export default ProductPage;