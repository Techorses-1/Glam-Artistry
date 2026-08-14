import React from "react";
import "./KitchenwareHero.scss";
import { motion, useInView } from "framer-motion";

const KitchenwareHero = () => {
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
    <section className="kitchenware-hero-section" ref={sectionRef}>
      {/* BG IMAGE — static, no animation */}
      <img 
        src="https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?q=80&w=1600" 
        alt="kitchenware hero" 
        className="kitchenware-hero-bg" 
      />

      {/* OVERLAY - static, no animation */}
      <div className="kitchenware-hero-overlay">
        {/* ANIMATED TEXT ONLY */}
        <motion.h1
          className="kitchenware-hero-title"
          variants={textVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          Kitchenware
        </motion.h1>
      </div>
    </section>
  );
};

export default KitchenwareHero;