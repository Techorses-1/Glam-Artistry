import React from "react";
import "./FameSection.scss";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { motion, useInView } from "framer-motion";
import "swiper/css";
import "swiper/css/pagination";

// Import logos
import bigbasketLogo from "../../../assets/home/logos/blinkit.png";
import zeptoLogo from "../../../assets/home/logos/zepto.png";
import amazonLogo from "../../../assets/home/logos/amazon.png";
import blinkitLogo from "../../../assets/home/logos/blinkit.png";
import flipkartLogo from "../../../assets/home/logos/flipkart.png";

const images = [
  "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=800",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800",
  "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800",
];

const logos = [
  { name: "BigBasket", logo: bigbasketLogo, backgroundColor: "#FFFFFF" },
  { name: "Zepto", logo: zeptoLogo, backgroundColor: "#FFFFFF" },
  { name: "Amazon", logo: amazonLogo, backgroundColor: "#FFFFFF" },
  { name: "Blinkit", logo: blinkitLogo, backgroundColor: "#FFFFFF" },
  { name: "Flipkart", logo: flipkartLogo, backgroundColor: "#FFFFFF" },
];

// Triplicate for seamless infinite scroll
const marqueeLogos = [...logos, ...logos, ...logos];

const FameSection = () => {
  const sectionRef = React.useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const titleVariants = {
    hidden: { opacity: 0, y: -40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: i * 0.1,
        ease: "easeOut"
      }
    }),
    hover: {
      scale: 1.03,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 0.3,
        ease: "easeOut"
      }
    }
  };

  const logoVariants = {
    hover: {
      y: -8,
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.section
      className="fame-section"
      ref={sectionRef}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2
        className="fame-title"
        variants={titleVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        Join The Fame
      </motion.h2>

      {/* DESKTOP GRID */}
      <div className="fame-grid">
        {images.map((img, i) => (
          <motion.div
            className="fame-card"
            key={i}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            whileHover="hover"
          >
            <img src={img} alt="fame" loading="lazy" />
          </motion.div>
        ))}
      </div>

      {/* MOBILE / TABLET SLIDER */}
      <div className="fame-slider">
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={15}
          slidesPerView={2}
          autoplay={{ delay: 5000 }}
          pagination={{ clickable: true }}
          breakpoints={{ 768: { slidesPerView: 3 } }}
        >
          {images.map((img, i) => (
            <SwiperSlide key={i}>
              <motion.div
                className="fame-card"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.3 }}
              >
                <img src={img} alt="fame" />
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* BOTTOM SECTION */}
      <motion.div
        className="fame-platforms"
        variants={subtitleVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <h2 className="fame-subtitle">Now Closer to You</h2>

        {/* LOGOS MARQUEE */}
        <div className="fame-logos-outer">
          <div className="fame-logos-inner">
            {marqueeLogos.map((item, i) => (
              <motion.div
                className="fame-logo-item"
                key={i}
                variants={logoVariants}
                whileHover="hover"
              >
                <div
                  className="fame-logo-box"
                  style={{ backgroundColor: item.backgroundColor }}
                >
                  <img src={item.logo} alt={`${item.name} logo`} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

    </motion.section>
  );
};

export default FameSection;