import React, { useRef } from "react";
import "./BestSellers.scss";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { motion, useInView } from "framer-motion";
import product from "../../../assets/home/product.png";

const products = [
    { id: 1, name: "TBIO Water Glass Premium Edition", category: "Drinkware", price: 1200, oldPrice: 1800 },
    { id: 2, name: "Waterbottle Aqua Bliss WB750", category: "Drinkware", price: 1200, oldPrice: 1600 },
    { id: 3, name: "Pantry Jars PJS550 Set of Two", category: "Kitchenware", price: 1200, oldPrice: 1900 },
    { id: 4, name: "Crystal Mug Bloom Series", category: "Drinkware", price: 1200, oldPrice: 1500 },
    { id: 5, name: "TBIO Water Glass Citrus Edition", category: "Drinkware", price: 1200, oldPrice: 1800 },
    { id: 6, name: "Pantry Jars PJS550 Hearts", category: "Kitchenware", price: 1200, oldPrice: 1700 },
    { id: 7, name: "TBIO Water Glass Hummingbird", category: "Drinkware", price: 1200, oldPrice: 1600 },
    { id: 8, name: "Floral Jar Collection Gold Lid", category: "Kitchenware", price: 1200, oldPrice: 2000 },
];

const ProductCard = ({ item, index }) => {
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

    const pricingVariants = {
        hover: {
            scale: 1.02,
            transition: {
                duration: 0.2
            }
        }
    };

    return (
        <motion.div
            className="bs-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
        >
            <motion.div className="bs-card__image-wrap">
                <motion.img
                    src={product}
                    alt={item.name}
                    variants={imageVariants}
                    whileHover="hover"
                />
            </motion.div>
            <div className="bs-card__info">
                <motion.p className="bs-card__name">{item.name}</motion.p>
                <p className="bs-card__category">Glam Artistry</p>
                <motion.div
                    className="bs-card__pricing"
                    variants={pricingVariants}
                    whileHover="hover"
                >
                    <span className="bs-card__price">₹{item.price.toFixed(2)}</span>
                    <span className="bs-card__old-price">₹{item.oldPrice.toFixed(2)}</span>
                </motion.div>
            </div>
        </motion.div>
    );
};

const BestSellers = () => {
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

    const titleVariants = {
        hidden: { opacity: 0, y: -30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.7,
                ease: "easeOut"
            }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.2
            }
        }
    };

    const arrowVariants = {
        hover: {
            scale: 1.1,
            backgroundColor: "#2b2664",
            color: "#fff",
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        },
        tap: {
            scale: 0.9
        }
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

                {/* ── DESKTOP: 4+4 grid ── */}
                <motion.div
                    className="bs-desktop-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {products.map((item, index) => (
                        <ProductCard key={item.id} item={item} index={index} />
                    ))}
                </motion.div>

                {/* ── TABLET: slider only, 2 per view ── */}
                <div className="bs-tablet-view">
                    <div className="bs-slider-wrap">
                        <Swiper
                            modules={[Navigation, A11y]}
                            slidesPerView={2}
                            spaceBetween={20}
                            loop={true}
                            navigation={{
                                prevEl: ".bs-tablet-prev",
                                nextEl: ".bs-tablet-next",
                            }}
                        >
                            {products.map((item, index) => (
                                <SwiperSlide key={item.id}>
                                    <ProductCard item={item} index={index} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                        <div className="bs-arrows">
                            <motion.button
                                className="bs-arrow bs-tablet-prev"
                                variants={arrowVariants}
                                whileHover="hover"
                                whileTap="tap"
                            >
                                <FiChevronLeft />
                            </motion.button>
                            <motion.button
                                className="bs-arrow bs-tablet-next"
                                variants={arrowVariants}
                                whileHover="hover"
                                whileTap="tap"
                            >
                                <FiChevronRight />
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* ── MOBILE: slider only, 1 per view ── */}
                <div className="bs-mobile-view">
                    <div className="bs-slider-wrap">
                        <Swiper
                            modules={[Navigation, A11y]}
                            slidesPerView={1}
                            spaceBetween={16}
                            loop={true}
                            navigation={{
                                prevEl: ".bs-mobile-prev",
                                nextEl: ".bs-mobile-next",
                            }}
                        >
                            {products.map((item, index) => (
                                <SwiperSlide key={item.id}>
                                    <ProductCard item={item} index={index} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                        <div className="bs-arrows">
                            <motion.button
                                className="bs-arrow bs-mobile-prev"
                                variants={arrowVariants}
                                whileHover="hover"
                                whileTap="tap"
                            >
                                <FiChevronLeft />
                            </motion.button>
                            <motion.button
                                className="bs-arrow bs-mobile-next"
                                variants={arrowVariants}
                                whileHover="hover"
                                whileTap="tap"
                            >
                                <FiChevronRight />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.section>

        </div>
    );
};

export default BestSellers;