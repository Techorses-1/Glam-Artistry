// ContactHero.jsx
import React from "react";
import "./ContactHero.scss";
import { motion, useInView } from "framer-motion";

const ContactHero = () => {
    const sectionRef = React.useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

    const titleVariants = {
        hidden: { opacity: 0, y: 70, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 1.1,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.2,
            },
        },
    };

    const subtitleVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.9,
                ease: "easeOut",
                delay: 0.7,
            },
        },
    };

    return (
        <section className="contact-hero" ref={sectionRef}>
            <img
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1600"
                alt="contact hero"
                className="contact-hero__bg"
            />

            <div className="contact-hero__overlay">
                <div className="contact-hero__content">
                    <motion.h1
                        className="contact-hero__title"
                        variants={titleVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                    >
                        Let's start a <br />
                        conversation
                    </motion.h1>

                    <motion.p
                        className="contact-hero__subtitle"
                        variants={subtitleVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                    >
                        We'd love to hear from you. Reach out and we'll get back to you soon.
                    </motion.p>
                </div>
            </div>
        </section>
    );
};

export default ContactHero;