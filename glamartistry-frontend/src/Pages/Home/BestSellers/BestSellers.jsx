import React, { useRef, useState, useEffect } from "react";
import "./BestSellers.scss";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { FiChevronLeft, FiChevronRight, FiHeart } from "react-icons/fi";
import { motion, useInView } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ProductCard = ({ item, index, isInWishlist, onWishlistClick }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/product/${item.slug || item.productId}`);
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        },
        hover: {
            y: -8,
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
            transition: { duration: 0.2 }
        },
        tap: { scale: 0.9 }
    };

    // Format category name for display
    const formatCategory = (str) => {
        if (!str) return "Glam Artistry";
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Get the cheapest variation (lowest selling price)
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

    const isInWishlistState = isInWishlist && variationId && isInWishlist(variationId);

    const handleWishlistClick = (e) => {
        e.stopPropagation();
        if (onWishlistClick && variationId) {
            onWishlistClick(item.productId, variationId, designName, item.name);
        }
    };

    return (
        <motion.div
            className="bs-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            onClick={handleCardClick}
            style={{ cursor: "pointer" }}
        >
            <motion.div className="bs-card__image-wrap">
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
                    className={`bs-card__wishlist ${isInWishlistState ? "active" : ""}`}
                    variants={wishlistVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleWishlistClick}
                >
                    <FiHeart />
                </motion.div>
            </motion.div>
            <div className="bs-card__info">
                <motion.p className="bs-card__name">{item.name}</motion.p>
                <p className="bs-card__category">{formatCategory(item.subCategory)}</p>
                <motion.div className="bs-card__pricing">
                    <span className="bs-card__price">₹{sellingPrice.toFixed(2)}</span>
                    {hasDiscount && (
                        <span className="bs-card__old-price">₹{originalPrice.toFixed(2)}</span>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

const BestSellers = () => {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [wishlistMap, setWishlistMap] = useState({});

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

    // Fetch 8 random real products
    const fetchRandomProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/products/get-all?random=true&limit=8`,
                { credentials: "include" }
            );
            const data = await response.json();
            if (data.success) {
                setProducts(data.data);
            } else {
                toast.error(data.message || "Failed to fetch best sellers");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to load best sellers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRandomProducts();
        fetchWishlist();
    }, []);

    // Check wishlist status
    const checkWishlistStatus = (productId, variationId) => {
        const key = `${productId}-${variationId}`;
        return wishlistMap[key] || false;
    };

    // Get cheapest variation details for a product
    const getCheapestVariationDetails = (product) => {
        if (!product.variations || product.variations.length === 0) return null;
        const cheapest = product.variations.reduce((min, current) => {
            return (current.sellingPrice < min.sellingPrice) ? current : min;
        }, product.variations[0]);
        return {
            variationId: cheapest.variationId,
            designName: cheapest.designName
        };
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
                    window.location.href = "/login";
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

    const titleVariants = {
        hidden: { opacity: 0, y: -30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.7, ease: "easeOut" }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.2 }
        }
    };

    const arrowVariants = {
        hover: {
            scale: 1.1,
            backgroundColor: "#2b2664",
            color: "#fff",
            transition: { duration: 0.2, ease: "easeOut" }
        },
        tap: { scale: 0.9 }
    };

    return (
        <div className="main-best-sellers">
            <motion.section
                ref={sectionRef}
                className="bs-section"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.h2
                    className="bs-title"
                    variants={titleVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    Best Sellers
                </motion.h2>

                {products.length === 0 && !loading ? (
                    <div className="no-products">
                        <p>No products found.</p>
                    </div>
                ) : (
                    <>
                        {/* DESKTOP */}
                        <motion.div
                            className="bs-desktop-grid"
                            variants={containerVariants}
                            initial="hidden"
                            animate={isInView ? "visible" : "hidden"}
                        >
                            {products.map((item, index) => {
                                const cheapestVar = getCheapestVariationDetails(item);
                                return (
                                    <ProductCard
                                        key={item.productId || item.id}
                                        item={item}
                                        index={index}
                                        isInWishlist={() => cheapestVar ? checkWishlistStatus(item.productId, cheapestVar.variationId) : false}
                                        onWishlistClick={(productId, variationId, designName, productName) =>
                                            handleWishlistClick(productId, variationId, designName, productName)
                                        }
                                    />
                                );
                            })}
                        </motion.div>

                        {/* TABLET */}
                        <div className="bs-tablet-view">
                            <div className="bs-slider-wrap">
                                <Swiper
                                    modules={[Navigation, A11y]}
                                    slidesPerView={2}
                                    spaceBetween={20}
                                    loop={products.length > 2}
                                    navigation={{
                                        prevEl: ".bs-tablet-prev",
                                        nextEl: ".bs-tablet-next",
                                    }}
                                >
                                    {products.map((item, index) => {
                                        const cheapestVar = getCheapestVariationDetails(item);
                                        return (
                                            <SwiperSlide key={item.productId || item.id}>
                                                <ProductCard
                                                    item={item}
                                                    index={index}
                                                    isInWishlist={() => cheapestVar ? checkWishlistStatus(item.productId, cheapestVar.variationId) : false}
                                                    onWishlistClick={(productId, variationId, designName, productName) =>
                                                        handleWishlistClick(productId, variationId, designName, productName)
                                                    }
                                                />
                                            </SwiperSlide>
                                        );
                                    })}
                                </Swiper>
                                <div className="bs-arrows">
                                    <motion.button className="bs-arrow bs-tablet-prev" variants={arrowVariants} whileHover="hover" whileTap="tap">
                                        <FiChevronLeft />
                                    </motion.button>
                                    <motion.button className="bs-arrow bs-tablet-next" variants={arrowVariants} whileHover="hover" whileTap="tap">
                                        <FiChevronRight />
                                    </motion.button>
                                </div>
                            </div>
                        </div>

                        {/* MOBILE */}
                        <div className="bs-mobile-view">
                            <div className="bs-slider-wrap">
                                <Swiper
                                    modules={[Navigation, A11y]}
                                    slidesPerView={1}
                                    spaceBetween={16}
                                    loop={products.length > 1}
                                    navigation={{
                                        prevEl: ".bs-mobile-prev",
                                        nextEl: ".bs-mobile-next",
                                    }}
                                >
                                    {products.map((item, index) => {
                                        const cheapestVar = getCheapestVariationDetails(item);
                                        return (
                                            <SwiperSlide key={item.productId || item.id}>
                                                <ProductCard
                                                    item={item}
                                                    index={index}
                                                    isInWishlist={() => cheapestVar ? checkWishlistStatus(item.productId, cheapestVar.variationId) : false}
                                                    onWishlistClick={(productId, variationId, designName, productName) =>
                                                        handleWishlistClick(productId, variationId, designName, productName)
                                                    }
                                                />
                                            </SwiperSlide>
                                        );
                                    })}
                                </Swiper>
                                <div className="bs-arrows">
                                    <motion.button className="bs-arrow bs-mobile-prev" variants={arrowVariants} whileHover="hover" whileTap="tap">
                                        <FiChevronLeft />
                                    </motion.button>
                                    <motion.button className="bs-arrow bs-mobile-next" variants={arrowVariants} whileHover="hover" whileTap="tap">
                                        <FiChevronRight />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </motion.section>
        </div>
    );
};

export default BestSellers;