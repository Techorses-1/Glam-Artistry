import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiHome, FiShoppingBag, FiArrowLeft, FiHelpCircle, FiMail } from "react-icons/fi";
import { motion } from "framer-motion";
import "./NotFound.scss";

const NotFound = () => {
    const navigate = useNavigate();

    // Scroll to top on page load
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
        },
    };

    const floatVariants = {
        animate: {
            y: [0, -15, 0],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
            },
        },
    };

    return (
        <div className="nf">
            <div className="nf__container">
                <motion.div
                    className="nf__content"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Animated 404 Number */}
                    <motion.div className="nf__code" variants={itemVariants}>
                        <motion.span
                            className="nf__digit"
                            animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        >
                            4
                        </motion.span>
                        <motion.span
                            className="nf__digit nf__digit--zero"
                            variants={floatVariants}
                            animate="animate"
                        >
                            0
                        </motion.span>
                        <motion.span
                            className="nf__digit"
                            animate={{ rotate: [0, 5, -5, 3, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                        >
                            4
                        </motion.span>
                    </motion.div>

                    {/* Title & Description */}
                    <motion.h1 className="nf__title" variants={itemVariants}>
                        Oops! Page Not Found
                    </motion.h1>

                    <motion.p className="nf__description" variants={itemVariants}>
                        The page you are looking for might have been removed,
                        had its name changed, or is temporarily unavailable.
                    </motion.p>

                    {/* Action Buttons */}
                    <motion.div className="nf__actions" variants={itemVariants}>
                        <button
                            className="nf__btn nf__btn--primary"
                            onClick={() => navigate(-1)}
                        >
                            <FiArrowLeft /> Go Back
                        </button>
                        <button
                            className="nf__btn nf__btn--secondary"
                            onClick={() => navigate("/")}
                        >
                            <FiHome /> Home Page
                        </button>
                        <button
                            className="nf__btn nf__btn--outline"
                            onClick={() => navigate("/drinkware")}
                        >
                            <FiShoppingBag /> Shop Now
                        </button>
                    </motion.div>

                    {/* Help Section */}
                    {/* <motion.div className="nf__help" variants={itemVariants}>
                        <div className="nf__help-icon">
                            <FiHelpCircle />
                        </div>
                        <div className="nf__help-text">
                            <h4>Need Assistance?</h4>
                            <p>
                                If you believe this is an error, please{" "}
                                <button
                                    className="nf__link"
                                    onClick={() => navigate("/contact")}
                                >
                                    contact support
                                </button>{" "}
                                or email us at{" "}
                                <a href="mailto:support@glamartistry.com">
                                    support@glamartistry.com
                                </a>
                            </p>
                        </div>
                    </motion.div> */}

                    {/* Decorative Elements */}
                    <div className="nf__decor nf__decor--1"></div>
                    <div className="nf__decor nf__decor--2"></div>
                    <div className="nf__decor nf__decor--3"></div>
                </motion.div>
            </div>
        </div>
    );
};

export default NotFound;