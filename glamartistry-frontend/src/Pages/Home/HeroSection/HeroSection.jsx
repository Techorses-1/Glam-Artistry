import React from "react";
import "./HeroSection.scss";
import { motion, useInView } from "framer-motion";

const HeroSection = () => {
  const sectionRef = React.useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  const textVariants = {
    hidden: {
      opacity: 0,
      y: 80,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.3
      }
    }
  };

  return (
    <section className="hero-section" ref={sectionRef}>
      {/* BG IMAGE — static, no animation */}
      <img
        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600"
        alt="hero"
        className="hero-bg"
      />

      {/* OVERLAY - static, no animation */}
      <div className="hero-overlay">
        {/* ANIMATED TEXT ONLY */}
        <motion.h1
          className="hero-title"
          variants={textVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          A world of <br />
          artful living
        </motion.h1>
      </div>
    </section>
  );
};

export default HeroSection;