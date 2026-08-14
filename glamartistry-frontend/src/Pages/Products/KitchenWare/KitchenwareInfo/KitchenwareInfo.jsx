import React from "react";
import "./KitchenwareInfo.scss";
import { motion, useInView } from "framer-motion";

const KitchenwareInfo = () => {
    const sectionRef = React.useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

    const textVariants = {
        hidden: {
            opacity: 0,
            y: 30,
            scale: 0.98
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.2
            }
        }
    };

    return (
        <motion.section
            className="kitchenware-info"
            ref={sectionRef}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="kitchenware-info-container"
                variants={textVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
            >
                <p>
                    At Glam Artistry, our kitchenware collection is thoughtfully crafted to elevate your cooking and storage experience. Drawing inspiration from timeless designs and created with premium-quality materials, each piece reflects refined beauty through graceful shapes and detailed craftsmanship.
                </p>
            </motion.div>
        </motion.section>
    );
};

export default KitchenwareInfo;