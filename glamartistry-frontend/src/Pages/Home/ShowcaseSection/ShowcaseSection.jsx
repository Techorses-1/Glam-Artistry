import React, { useRef } from "react";
import "./ShowcaseSection.scss";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { motion, useInView } from "framer-motion";

const ShowcaseSection = () => {
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1,
            }
        }
    };

    const topContentVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        }
    };

    const imageVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.7,
                ease: "easeOut"
            }
        }
    };

    const contentVariants = {
        hidden: { opacity: 0, x: -30 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.7,
                delay: 0.2,
                ease: "easeOut"
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                delay: i * 0.15,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        })
    };

    return (
        <section ref={sectionRef} className="showcase-section">
            
            <div className="main-showcase">
            <div className="showcase-top">
                <motion.div
                    className="showcase-image"
                    variants={imageVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.4 }}
                >
                    <img
                        src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200"
                        alt="mugs"
                        loading="lazy"
                    />
                </motion.div>
                <motion.div
                    className="showcase-content"
                    variants={contentVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    <p>
                        Handcrafted for those who refuse the ordinary, these mugs transform
                        daily coffee and tea into moments of joy. Each one is artisan-shaped
                        with playful character - where even the simplest sip is elevated by
                        the cutest companion to brighten everyday.
                    </p>
                </motion.div>
            </div>
            </div>

            {/* BOTTOM */}
            <div className="showcase-bottom">
                {/* DESKTOP GRID */}
                <div className="showcase-grid">
                    <motion.div
                        className="showcase-card"
                        custom={0}
                        variants={cardVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                    >
                        <div className="card-image-wrapper">
                            <img
                                src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1200"
                                alt="drinkware"
                                loading="lazy"
                            />
                        </div>
                        <div className="showcase-label">
                            Drinkware
                        </div>
                    </motion.div>

                    <motion.div
                        className="showcase-card"
                        custom={1}
                        variants={cardVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                    >
                        <div className="card-image-wrapper">
                            <img
                                src="https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?q=80&w=1200"
                                alt="kitchenware"
                                loading="lazy"
                            />
                        </div>
                        <div className="showcase-label">
                            Kitchenware
                        </div>
                    </motion.div>
                </div>

                {/* MOBILE / TABLET SLIDER */}
                <div className="showcase-slider">
                    <Swiper
                        modules={[Autoplay, Navigation]}
                        slidesPerView={1}
                        loop={true}
                        autoplay={{ delay: 5000, disableOnInteraction: false }}
                        navigation={{
                            prevEl: prevRef.current,
                            nextEl: nextRef.current,
                        }}
                        onSwiper={(swiper) => {
                            setTimeout(() => {
                                if (swiper.params?.navigation) {
                                    swiper.params.navigation.prevEl = prevRef.current;
                                    swiper.params.navigation.nextEl = nextRef.current;
                                    swiper.navigation.destroy();
                                    swiper.navigation.init();
                                    swiper.navigation.update();
                                }
                            });
                        }}
                    >
                        <SwiperSlide>
                            <div className="showcase-card">
                                <div className="card-image-wrapper">
                                    <img
                                        src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1200"
                                        alt="drinkware"
                                    />
                                </div>
                                <div className="showcase-label">
                                    Drinkware
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide>
                            <div className="showcase-card">
                                <div className="card-image-wrapper">
                                    <img
                                        src="https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?q=80&w=1200"
                                        alt="kitchenware"
                                    />
                                </div>
                                <div className="showcase-label">
                                    Kitchenware
                                </div>
                            </div>
                        </SwiperSlide>
                    </Swiper>

                    <button className="showcase-prev" ref={prevRef}>
                        <FiChevronLeft />
                    </button>
                    <button className="showcase-next" ref={nextRef}>
                        <FiChevronRight />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ShowcaseSection;