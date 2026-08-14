import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { FiChevronLeft, FiChevronRight, FiHeart } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./RelatedProducts.scss";

const RelatedProductCard = ({ item, index, isInWishlist, onWishlistClick }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/product/${item.productId}`);
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                delay: index * 0.05,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        },
        hover: {
            y: -6,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        }
    };

    const imageVariants = {
        hover: {
            scale: 1.08,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    };

    const wishlistVariants = {
        hover: {
            scale: 1.15,
            transition: {
                duration: 0.2
            }
        },
        tap: {
            scale: 0.9
        }
    };

    // Format category name for display
    const formatCategory = (str) => {
        if (!str) return "Glam Artistry";
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Get the cheapest variation
    const getCheapestVariation = () => {
        if (!item.variations || item.variations.length === 0) {
            return {
                sellingPrice: item.minPrice || 0,
                originalPrice: item.originalPrice || 0,
                variationId: null,
                designName: null
            };
        }

        const cheapest = item.variations.reduce((min, current) => {
            return (current.sellingPrice < min.sellingPrice) ? current : min;
        }, item.variations[0]);

        return {
            sellingPrice: cheapest.sellingPrice,
            originalPrice: cheapest.originalPrice,
            variationId: cheapest.variationId,
            designName: cheapest.designName
        };
    };

    const { sellingPrice, originalPrice, variationId, designName } = getCheapestVariation();
    const hasDiscount = originalPrice && originalPrice > sellingPrice;

    // Check if this product's cheapest variation is in wishlist
    const isInWishlistState = isInWishlist && variationId && isInWishlist(variationId);

    const handleWishlistClick = (e) => {
        e.stopPropagation();
        if (onWishlistClick && variationId) {
            onWishlistClick(item.productId, variationId, designName, item.name);
        }
    };

    return (
        <motion.div
            className="rp-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            onClick={handleCardClick}
            style={{ cursor: "pointer" }}
        >
            <motion.div className="rp-card__image-wrap">
                <motion.img
                    src={item.thumbnail}
                    alt={item.name}
                    variants={imageVariants}
                    whileHover="hover"
                    onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
                    }}
                />
                <motion.div
                    className={`rp-card__wishlist ${isInWishlistState ? "active" : ""}`}
                    variants={wishlistVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleWishlistClick}
                >
                    <FiHeart />
                </motion.div>
            </motion.div>
            <div className="rp-card__info">
                <motion.p className="rp-card__name">{item.name}</motion.p>
                <p className="rp-card__category">{formatCategory(item.subCategory)}</p>
                <motion.div className="rp-card__pricing">
                    <span className="rp-card__price">₹{sellingPrice.toFixed(2)}</span>
                    {hasDiscount && (
                        <span className="rp-card__old-price">₹{originalPrice.toFixed(2)}</span>
                    )}
                </motion.div>
                {item.variations?.length > 1 && (
                    <p className="rp-card__variations-count">
                        +{item.variations.length - 1} more designs
                    </p>
                )}
            </div>
        </motion.div>
    );
};

const RelatedProducts = ({ currentProductId, mainCategory, subCategory }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wishlistMap, setWishlistMap] = useState({});
    const navigate = useNavigate();

    // Fetch wishlist
    const fetchWishlist = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/wishlist/get`, {
                credentials: "include",
            });
            const data = await response.json();

            if (data.success && data.data) {
                const map = {};
                data.data.forEach(item => {
                    const key = `${item.productId}-${item.variationId}`;
                    map[key] = true;
                });
                setWishlistMap(map);
            }
        } catch (error) {
            console.error("Failed to fetch wishlist:", error);
        }
    };

    // Fetch related products
    const fetchRelatedProducts = async () => {
        setLoading(true);
        try {
            let relatedProducts = [];
            
            // Step 1: Get products with same mainCategory + same subCategory
            const sameSubResponse = await fetch(
                `${import.meta.env.VITE_API_URL}/products/get-all?mainCategory=${mainCategory}&subCategory=${subCategory}&limit=10`,
                { credentials: "include" }
            );
            const sameSubData = await sameSubResponse.json();
            
            if (sameSubData.success) {
                let filtered = sameSubData.data.filter(p => p.productId !== currentProductId);
                relatedProducts.push(...filtered);
            }
            
            // Step 2: If less than 4, get products from same mainCategory (different subCategory)
            if (relatedProducts.length < 4) {
                const sameMainResponse = await fetch(
                    `${import.meta.env.VITE_API_URL}/products/get-all?mainCategory=${mainCategory}&limit=10`,
                    { credentials: "include" }
                );
                const sameMainData = await sameMainResponse.json();
                
                if (sameMainData.success) {
                    const filtered = sameMainData.data.filter(p => 
                        p.productId !== currentProductId && 
                        p.subCategory !== subCategory &&
                        !relatedProducts.some(rp => rp.productId === p.productId)
                    );
                    relatedProducts.push(...filtered);
                }
            }
            
            // Step 3: If still less than 4, get any products (fallback)
            if (relatedProducts.length < 4) {
                const anyProductsResponse = await fetch(
                    `${import.meta.env.VITE_API_URL}/products/get-all?limit=10`,
                    { credentials: "include" }
                );
                const anyProductsData = await anyProductsResponse.json();
                
                if (anyProductsData.success) {
                    const filtered = anyProductsData.data.filter(p => 
                        p.productId !== currentProductId &&
                        !relatedProducts.some(rp => rp.productId === p.productId)
                    );
                    relatedProducts.push(...filtered);
                }
            }
            
            // Limit to 4 products
            setProducts(relatedProducts.slice(0, 4));
        } catch (error) {
            console.error("Failed to fetch related products:", error);
            toast.error("Failed to load related products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mainCategory) {
            fetchRelatedProducts();
            fetchWishlist();
        }
    }, [mainCategory, subCategory, currentProductId]);

    // Check if specific product variation is in wishlist
    const checkWishlistStatus = (productId, variationId) => {
        const key = `${productId}-${variationId}`;
        return wishlistMap[key] || false;
    };

    // Handle add/remove from wishlist
    const handleWishlistClick = async (productId, variationId, designName, productName) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile`, {
                credentials: "include",
            });

            if (!response.ok) {
                toast.error("Please login to add items to wishlist");
                setTimeout(() => {
                    navigate("/login");
                }, 1500);
                return;
            }

            const key = `${productId}-${variationId}`;
            const isCurrentlyInWishlist = checkWishlistStatus(productId, variationId);

            if (isCurrentlyInWishlist) {
                const removeResponse = await fetch(
                    `${import.meta.env.VITE_API_URL}/wishlist/remove/${productId}/${variationId}`,
                    { method: "DELETE", credentials: "include" }
                );
                const removeData = await removeResponse.json();

                if (removeData.success) {
                    toast.success(`${productName} (${designName}) removed from wishlist`);
                    const newMap = { ...wishlistMap };
                    delete newMap[key];
                    setWishlistMap(newMap);
                } else {
                    toast.error(removeData.message || "Failed to remove from wishlist");
                }
            } else {
                const addResponse = await fetch(`${import.meta.env.VITE_API_URL}/wishlist/add`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ productId, variationId }),
                });
                const addData = await addResponse.json();

                if (addData.success) {
                    toast.success(`${productName} (${designName}) added to wishlist`);
                    setWishlistMap({ ...wishlistMap, [key]: true });
                } else if (addData.message === "Item already in wishlist") {
                    toast.info("Item already in wishlist");
                } else {
                    toast.error(addData.message || "Failed to add to wishlist");
                }
            }
        } catch (error) {
            console.error("Wishlist error:", error);
            toast.error("Something went wrong");
        }
    };

    // Get cheapest variation details
    const getCheapestVariationDetails = (product) => {
        if (!product.variations || product.variations.length === 0) {
            return null;
        }
        const cheapest = product.variations.reduce((min, current) => {
            return (current.sellingPrice < min.sellingPrice) ? current : min;
        }, product.variations[0]);
        return {
            variationId: cheapest.variationId,
            designName: cheapest.designName
        };
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    // Don't show if no products
    if (!loading && products.length === 0) {
        return null;
    }

    return (
        <div className="rp-section">
            <div className="rp-header">
                <h2>You May Also Like</h2>
                <div className="rp-divider"></div>
            </div>

            <div className="rp-products-wrapper">
                {loading ? (
                    <div className="rp-loading">
                        <div className="rp-spinner"></div>
                        <p>Loading related products...</p>
                    </div>
                ) : (
                    <>
                        {/* DESKTOP GRID (4 columns) */}
                        <div className="rp-desktop-view">
                            <motion.div
                                className="rp-desktop-grid"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {products.map((item, index) => {
                                    const cheapestVar = getCheapestVariationDetails(item);
                                    return (
                                        <RelatedProductCard
                                            key={item.productId}
                                            item={item}
                                            index={index}
                                            isInWishlist={(variationId) => cheapestVar ? checkWishlistStatus(item.productId, cheapestVar.variationId) : false}
                                            onWishlistClick={(productId, variationId, designName, productName) =>
                                                handleWishlistClick(productId, variationId, designName, productName)
                                            }
                                        />
                                    );
                                })}
                            </motion.div>
                        </div>

                        {/* TABLET SLIDER (2 slides, infinite loop) */}
                        <div className="rp-tablet-view">
                            <div className="rp-slider-wrap">
                                {products.length > 2 ? (
                                    <Swiper
                                        modules={[Navigation, A11y]}
                                        slidesPerView={2}
                                        spaceBetween={20}
                                        loop={true}
                                        loopAdditionalSlides={2}
                                        navigation={{
                                            prevEl: ".rp-tablet-prev",
                                            nextEl: ".rp-tablet-next",
                                        }}
                                    >
                                        {products.map((item, index) => {
                                            const cheapestVar = getCheapestVariationDetails(item);
                                            return (
                                                <SwiperSlide key={item.productId}>
                                                    <RelatedProductCard
                                                        item={item}
                                                        index={index}
                                                        isInWishlist={(variationId) => cheapestVar ? checkWishlistStatus(item.productId, cheapestVar.variationId) : false}
                                                        onWishlistClick={(productId, variationId, designName, productName) =>
                                                            handleWishlistClick(productId, variationId, designName, productName)
                                                        }
                                                    />
                                                </SwiperSlide>
                                            );
                                        })}
                                    </Swiper>
                                ) : (
                                    <div className="rp-grid-fallback">
                                        {products.map((item, index) => {
                                            const cheapestVar = getCheapestVariationDetails(item);
                                            return (
                                                <RelatedProductCard
                                                    key={item.productId}
                                                    item={item}
                                                    index={index}
                                                    isInWishlist={(variationId) => cheapestVar ? checkWishlistStatus(item.productId, cheapestVar.variationId) : false}
                                                    onWishlistClick={(productId, variationId, designName, productName) =>
                                                        handleWishlistClick(productId, variationId, designName, productName)
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                                {products.length > 2 && (
                                    <div className="rp-arrows">
                                        <button className="rp-arrow rp-tablet-prev">
                                            <FiChevronLeft />
                                        </button>
                                        <button className="rp-arrow rp-tablet-next">
                                            <FiChevronRight />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MOBILE SLIDER (1 slide, infinite loop) */}
                        <div className="rp-mobile-view">
                            <div className="rp-slider-wrap">
                                {products.length > 1 ? (
                                    <Swiper
                                        modules={[Navigation, A11y]}
                                        slidesPerView={1}
                                        spaceBetween={16}
                                        loop={true}
                                        loopAdditionalSlides={2}
                                        navigation={{
                                            prevEl: ".rp-mobile-prev",
                                            nextEl: ".rp-mobile-next",
                                        }}
                                    >
                                        {products.map((item, index) => {
                                            const cheapestVar = getCheapestVariationDetails(item);
                                            return (
                                                <SwiperSlide key={item.productId}>
                                                    <RelatedProductCard
                                                        item={item}
                                                        index={index}
                                                        isInWishlist={(variationId) => cheapestVar ? checkWishlistStatus(item.productId, cheapestVar.variationId) : false}
                                                        onWishlistClick={(productId, variationId, designName, productName) =>
                                                            handleWishlistClick(productId, variationId, designName, productName)
                                                        }
                                                    />
                                                </SwiperSlide>
                                            );
                                        })}
                                    </Swiper>
                                ) : (
                                    <div className="rp-grid-fallback">
                                        {products.map((item, index) => {
                                            const cheapestVar = getCheapestVariationDetails(item);
                                            return (
                                                <RelatedProductCard
                                                    key={item.productId}
                                                    item={item}
                                                    index={index}
                                                    isInWishlist={(variationId) => cheapestVar ? checkWishlistStatus(item.productId, cheapestVar.variationId) : false}
                                                    onWishlistClick={(productId, variationId, designName, productName) =>
                                                        handleWishlistClick(productId, variationId, designName, productName)
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                                {products.length > 1 && (
                                    <div className="rp-arrows">
                                        <button className="rp-arrow rp-mobile-prev">
                                            <FiChevronLeft />
                                        </button>
                                        <button className="rp-arrow rp-mobile-next">
                                            <FiChevronRight />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RelatedProducts;