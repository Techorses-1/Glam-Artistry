import React, { useState, useEffect, useRef } from "react";
import "./DrinkwareProducts.scss";
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



    // Add this function
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
                delay: index * 0.05,
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
            className="dp-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            onClick={handleCardClick}  // ← ADD THIS LINE
            style={{ cursor: "pointer" }}
        >
            <motion.div className="dp-card__image-wrap">
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
                    className={`dp-card__wishlist ${isInWishlistState ? "active" : ""}`}
                    variants={wishlistVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleWishlistClick}
                >
                    <FiHeart />
                </motion.div>
            </motion.div>
            <div className="dp-card__info">
                <motion.p className="dp-card__name">{item.name}</motion.p>
                <p className="dp-card__category">{formatCategory(item.subCategory)}</p>
                <motion.div className="dp-card__pricing">
                    <span className="dp-card__price">₹{sellingPrice.toFixed(2)}</span>
                    {hasDiscount && (
                        <span className="dp-card__old-price">₹{originalPrice.toFixed(2)}</span>
                    )}
                </motion.div>
                {item.variations?.length > 1 && (
                    <p className="dp-card__variations-count">
                        +{item.variations.length - 1} more designs
                    </p>
                )}
            </div>
        </motion.div>
    );
};

const DrinkwareProducts = () => {
    const sectionRef = React.useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    const [activeCategory, setActiveCategory] = useState("bottles");
    const [currentPage, setCurrentPage] = useState(1);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [wishlistMap, setWishlistMap] = useState({});
    const productsPerPage = 12;

    // Sub categories for Drinkware
    const subCategories = [
        { key: "bottles", label: "Bottles" },
        { key: "glasses", label: "Glasses" },
        { key: "coffee jars", label: "Coffee Jars" },
        { key: "jug sets", label: "Jug Sets" }
    ];

    // Fetch wishlist to check which products are in it
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

    // Fetch products from API
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/products/get-all?mainCategory=drinkware&page=${currentPage}&limit=${productsPerPage}`,
                { credentials: "include" }
            );
            const data = await response.json();

            if (data.success) {
                setProducts(data.data);
                setTotalPages(data.pagination.totalPages);
            } else {
                toast.error(data.message || "Failed to fetch products");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchWishlist();
    }, [currentPage]);

    // Check if a product variation is in wishlist
    const isInWishlist = (variationId) => {
        // Need productId to check - this will be handled differently
        // For now, we'll pass productId + variationId
        return false;
    };

    // Check if specific product variation is in wishlist
    const checkWishlistStatus = (productId, variationId) => {
        const key = `${productId}-${variationId}`;
        return wishlistMap[key] || false;
    };

    // Handle add/remove from wishlist
    const handleWishlistClick = async (productId, variationId, designName, productName) => {
        try {
            // Check if user is logged in
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
                // Remove from wishlist
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
                // Add to wishlist
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

    // Get cheapest variation details for a product
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

    // Filter products based on active sub category
    const filteredProducts = products.filter(p => p.subCategory === activeCategory);

    // Pagination logic for filtered products
    const startIndex = (currentPage - 1) * productsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);
    const filteredTotalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const handleCategoryChange = (category) => {
        setActiveCategory(category);
        setCurrentPage(1);
    };

    const contentVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.7,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.2
            }
        }
    };

    const buttonContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.4
            }
        }
    };

    const buttonVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        },
        hover: {
            scale: 1.05,
            backgroundColor: "#2b2664",
            color: "#fff",
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        },
        tap: {
            scale: 0.95
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.2
            }
        }
    };

    // Loading state
    // if (loading && products.length === 0) {
    //     return (
    //         <div className="drinkware-loading">
    //             <div className="loading-spinner"></div>
    //             <p>Loading products...</p>
    //         </div>
    //     );
    // }

    return (
        <motion.section
            className="drinkware-section"
            ref={sectionRef}
        >
            {/* TEXT CONTENT + BUTTONS - WHITE BG */}
            <div className="drinkware-content">
                <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    <p>
                        Sophisticated Glam Artistry drinkware reflects thoughtful craftsmanship
                        and enduring style. From elegant glasses to stylish water bottles,
                        every piece is designed using high-clarity materials that offer a smooth
                        finish, balanced weight, and beautiful light reflection. Our printed
                        glassware, coffee jars, and jug sets feature refined patterns and
                        artistic details that instantly elevate everyday moments into a premium
                        experience.
                    </p>

                    <p>
                        Whether you are serving guests with a coordinated jug set, enjoying your
                        morning coffee from a beautifully designed jar, or carrying your favorite
                        beverage in a sleek water bottle, Glam Artistry drinkware adds charm and
                        functionality to your routine. Complete your table setting with our
                        harmonized collection that blends modern aesthetics with timeless elegance.
                    </p>
                </motion.div>

                {/* BUTTONS - INSIDE TEXT SECTION (WHITE BG) */}
                <motion.div
                    className="drinkware-buttons"
                    variants={buttonContainerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {subCategories.map((cat) => (
                        <motion.button
                            key={cat.key}
                            className={activeCategory === cat.key ? "active" : ""}
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => handleCategoryChange(cat.key)}
                        >
                            {cat.label}
                        </motion.button>
                    ))}
                </motion.div>
            </div>

            {/* PRODUCTS SECTION WRAPPER WITH eaf3f3 BG */}
            <div className="drinkware-products-wrapper">
                {/* No products message */}
                {filteredProducts.length === 0 && !loading ? (
                    <div className="no-products">
                        <p>No products found in {activeCategory} category.</p>
                    </div>
                ) : (
                    <>
                        {/* DESKTOP GRID WITH PAGINATION */}
                        <div className="dp-desktop-view">
                            <motion.div
                                className="dp-desktop-grid"
                                variants={containerVariants}
                                initial="hidden"
                                animate={isInView ? "visible" : "hidden"}
                                key={activeCategory}
                            >
                                {currentProducts.map((item, index) => {
                                    const cheapestVar = getCheapestVariationDetails(item);
                                    return (
                                        <ProductCard
                                            key={item.productId || item.id}
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

                            {/* PAGINATION */}
                            {filteredTotalPages > 1 && (
                                <div className="dp-pagination">
                                    <button
                                        className={`dp-page-btn ${currentPage === 1 ? "disabled" : ""}`}
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    <div className="dp-page-numbers">
                                        {[...Array(filteredTotalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                className={`dp-page-num ${currentPage === i + 1 ? "active" : ""}`}
                                                onClick={() => setCurrentPage(i + 1)}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        className={`dp-page-btn ${currentPage === filteredTotalPages ? "disabled" : ""}`}
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, filteredTotalPages))}
                                        disabled={currentPage === filteredTotalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* TABLET SLIDER */}
                        <div className="dp-tablet-view">
                            <div className="dp-slider-wrap">
                                <Swiper
                                    modules={[Navigation, A11y]}
                                    slidesPerView={2}
                                    spaceBetween={20}
                                    loop={filteredProducts.length > 2}
                                    navigation={{
                                        prevEl: ".dp-tablet-prev",
                                        nextEl: ".dp-tablet-next",
                                    }}
                                >
                                    {filteredProducts.map((item, index) => {
                                        const cheapestVar = getCheapestVariationDetails(item);
                                        return (
                                            <SwiperSlide key={item.productId || item.id}>
                                                <ProductCard
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
                                <div className="dp-arrows">
                                    <button className="dp-arrow dp-tablet-prev">
                                        <FiChevronLeft />
                                    </button>
                                    <button className="dp-arrow dp-tablet-next">
                                        <FiChevronRight />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* MOBILE SLIDER */}
                        <div className="dp-mobile-view">
                            <div className="dp-slider-wrap">
                                <Swiper
                                    modules={[Navigation, A11y]}
                                    slidesPerView={1}
                                    spaceBetween={16}
                                    loop={filteredProducts.length > 1}
                                    navigation={{
                                        prevEl: ".dp-mobile-prev",
                                        nextEl: ".dp-mobile-next",
                                    }}
                                >
                                    {filteredProducts.map((item, index) => {
                                        const cheapestVar = getCheapestVariationDetails(item);
                                        return (
                                            <SwiperSlide key={item.productId || item.id}>
                                                <ProductCard
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
                                <div className="dp-arrows">
                                    <button className="dp-arrow dp-mobile-prev">
                                        <FiChevronLeft />
                                    </button>
                                    <button className="dp-arrow dp-mobile-next">
                                        <FiChevronRight />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </motion.section>
    );
};


export default DrinkwareProducts;