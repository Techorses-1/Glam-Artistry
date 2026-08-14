// import React from "react";
// import "./CtaBanner.scss";
// import { motion, useInView } from "framer-motion";

// const CtaBanner = () => {
//   const sectionRef = React.useRef(null);
//   const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

//   const textVariants = {
//     hidden: {
//       opacity: 0,
//       y: 50,
//       scale: 0.9
//     },
//     visible: {
//       opacity: 1,
//       y: 0,
//       scale: 1,
//       transition: {
//         duration: 0.9,
//         ease: [0.25, 0.46, 0.45, 0.94],
//         delay: 0.2
//       }
//     }
//   };

//   return (
//     <section className="cta-banner" ref={sectionRef}>
//       <div className="cta-banner-overlay">
//         <motion.h2
//           className="cta-banner-text"
//           variants={textVariants}
//           initial="hidden"
//           animate={isInView ? "visible" : "hidden"}
//         >
//           Turn every table into art
//         </motion.h2>
//       </div>
//     </section>
//   );
// };

// export default CtaBanner;





import React from "react";
import "./CtaBanner.scss";
import { motion, useInView } from "framer-motion";

const CtaBanner = () => {
  const sectionRef = React.useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  const textVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.9,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0.2
      }
    }
  };

  return (
    <section className="cta-banner" ref={sectionRef}>
      <div className="cta-banner-overlay">
        <motion.h2 
          className="cta-banner-text"
          variants={textVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          Turn every table into art
        </motion.h2>
      </div>
    </section>
  );
};

export default CtaBanner;