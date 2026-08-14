import React from "react";
import "./DrinkwareHero.scss";
import { motion, useInView } from "framer-motion";

const DrinkwareHero = () => {
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
    <section className="drinkware-hero-section" ref={sectionRef}>
      {/* BG IMAGE — static, no animation */}
      <img 
        src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1600" 
        alt="drinkware hero" 
        className="drinkware-hero-bg" 
      />

      {/* OVERLAY - static, no animation */}
      <div className="drinkware-hero-overlay">
        {/* ANIMATED TEXT ONLY */}
        <motion.h1
          className="drinkware-hero-title"
          variants={textVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          Drinkware
        </motion.h1>
      </div>
    </section>
  );
};

export default DrinkwareHero;