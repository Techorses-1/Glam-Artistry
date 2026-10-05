// ContactSection.jsx
import React from "react";
import "./ContactSection.scss";
import { motion, useInView } from "framer-motion";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    FiMapPin,
    FiPhone,
    FiMail,
    FiClock,
    FiSend,
} from "react-icons/fi";
import {
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
    FaYoutube,
    FaWhatsapp,
} from "react-icons/fa";

const contactInfo = [
    {
        icon: <FiMapPin />,
        label: "Visit Us",
        value: "123, Glam Street, Ahmedabad, Gujarat, India",
        href: "https://maps.google.com/?q=Ahmedabad",
    },
    {
        icon: <FiPhone />,
        label: "Call Us",
        value: "+91 98765 43210",
        href: "tel:+919876543210",
    },
    {
        icon: <FiMail />,
        label: "Email Us",
        value: "support@glamartistry.com",
        href: "mailto:support@glamartistry.com",
    },
    {
        icon: <FiClock />,
        label: "Working Hours",
        value: "Mon - Sat: 10:00 AM - 7:00 PM",
        href: null,
    },
];

const socialLinks = [
    { name: "Facebook", icon: <FaFacebookF />, href: "https://facebook.com" },
    { name: "Instagram", icon: <FaInstagram />, href: "https://instagram.com" },
    { name: "LinkedIn", icon: <FaLinkedinIn />, href: "https://linkedin.com" },
    { name: "YouTube", icon: <FaYoutube />, href: "https://youtube.com" },
    { name: "WhatsApp", icon: <FaWhatsapp />, href: "https://wa.me/919876543210" },
];

const validationSchema = Yup.object({
    name: Yup.string()
        .trim()
        .min(2, "Name is too short")
        .max(50, "Name is too long")
        .required("Name is required"),
    email: Yup.string()
        .trim()
        .email("Enter a valid email")
        .required("Email is required"),
    phone: Yup.string()
        .trim()
        .matches(/^[0-9+\-\s]{10,15}$/, "Enter a valid phone number")
        .required("Phone number is required"),
    subject: Yup.string()
        .trim()
        .min(3, "Subject is too short")
        .max(100, "Subject is too long")
        .required("Subject is required"),
    message: Yup.string()
        .trim()
        .min(10, "Message must be at least 10 characters")
        .max(1000, "Message is too long")
        .required("Message is required"),
});

const ContactSection = () => {
    const sectionRef = React.useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

    const formik = useFormik({
        initialValues: {
            name: "",
            email: "",
            phone: "",
            subject: "",
            message: "",
        },
        validationSchema,
        onSubmit: async (values, { resetForm, setSubmitting }) => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/contact/send`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(values),
                    }
                );
                const data = await response.json();

                if (data.success) {
                    toast.success("Message sent! We'll get back to you soon.");
                    resetForm();
                } else {
                    toast.error(data.message || "Failed to send message");
                }
            } catch (error) {
                console.error("Contact error:", error);
                toast.error("Something went wrong. Please try again.");
            } finally {
                setSubmitting(false);
            }
        },
    });

    const hasError = (field) => formik.touched[field] && formik.errors[field];

    const headerVariants = {
        hidden: { opacity: 0, y: -30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.7, ease: "easeOut" },
        },
    };

    const infoPanelVariants = {
        hidden: { opacity: 0, x: -60 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
        },
    };

    const formPanelVariants = {
        hidden: { opacity: 0, x: 60 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 25 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, delay: 0.4 + i * 0.1, ease: "easeOut" },
        }),
    };

    const socialVariants = {
        hover: { y: -6, scale: 1.1, transition: { duration: 0.25 } },
        tap: { scale: 0.92 },
    };

    return (
        <section className="contact-section" ref={sectionRef}>
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="contact-section__inner">
                <motion.div
                    className="contact-section__header"
                    variants={headerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    <span className="contact-section__tag">Contact Us</span>
                    <h2 className="contact-section__title">Get in touch</h2>
                    <p className="contact-section__desc">
                        Have a question, feedback or a bulk order? Fill out the form and
                        our team will respond within 24 hours.
                    </p>
                </motion.div>

                <div className="contact-section__grid">
                    {/* LEFT: INFO */}
                    <motion.div
                        className="contact-info"
                        variants={infoPanelVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                    >
                        <div className="contact-info__decor contact-info__decor--1"></div>
                        <div className="contact-info__decor contact-info__decor--2"></div>

                        <h3 className="contact-info__heading">Contact Information</h3>
                        <p className="contact-info__text">
                            Reach out through any of the channels below. We're always happy
                            to help.
                        </p>

                        <div className="contact-info__list">
                            {contactInfo.map((item, i) => {
                                const Wrapper = item.href ? motion.a : motion.div;
                                const extraProps = item.href
                                    ? {
                                        href: item.href,
                                        target: item.href.startsWith("http") ? "_blank" : undefined,
                                        rel: "noreferrer",
                                    }
                                    : {};
                                return (
                                    <Wrapper
                                        key={item.label}
                                        className="contact-info__item"
                                        custom={i}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate={isInView ? "visible" : "hidden"}
                                        {...extraProps}
                                    >
                                        <div className="contact-info__icon">{item.icon}</div>
                                        <div className="contact-info__details">
                                            <span className="contact-info__label">{item.label}</span>
                                            <span className="contact-info__value">{item.value}</span>
                                        </div>
                                    </Wrapper>
                                );
                            })}
                        </div>

                        <div className="contact-info__social">
                            <span className="contact-info__social-title">Follow Us</span>
                            <div className="contact-info__social-icons">
                                {socialLinks.map((social) => (
                                    <motion.a
                                        key={social.name}
                                        href={social.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={social.name}
                                        className="contact-info__social-link"
                                        variants={socialVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        {social.icon}
                                    </motion.a>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT: FORM */}
                    <motion.div
                        className="contact-form"
                        variants={formPanelVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                    >
                        <h3 className="contact-form__heading">Send us a message</h3>
                        <p className="contact-form__text">
                            All fields are required so we can help you faster.
                        </p>

                        <form onSubmit={formik.handleSubmit} noValidate>
                            <div className="contact-form__row">
                                <div className={`contact-form__group ${hasError("name") ? "has-error" : ""}`}>
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="John Doe"
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                    {hasError("name") && (
                                        <span className="contact-form__error">{formik.errors.name}</span>
                                    )}
                                </div>

                                <div className={`contact-form__group ${hasError("email") ? "has-error" : ""}`}>
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formik.values.email}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                    {hasError("email") && (
                                        <span className="contact-form__error">{formik.errors.email}</span>
                                    )}
                                </div>
                            </div>

                            <div className="contact-form__row">
                                <div className={`contact-form__group ${hasError("phone") ? "has-error" : ""}`}>
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="+91 98765 43210"
                                        value={formik.values.phone}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                    {hasError("phone") && (
                                        <span className="contact-form__error">{formik.errors.phone}</span>
                                    )}
                                </div>

                                <div className={`contact-form__group ${hasError("subject") ? "has-error" : ""}`}>
                                    <label htmlFor="subject">Subject</label>
                                    <input
                                        id="subject"
                                        name="subject"
                                        type="text"
                                        placeholder="How can we help?"
                                        value={formik.values.subject}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                    {hasError("subject") && (
                                        <span className="contact-form__error">{formik.errors.subject}</span>
                                    )}
                                </div>
                            </div>

                            <div className={`contact-form__group ${hasError("message") ? "has-error" : ""}`}>
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows="5"
                                    placeholder="Write your message here..."
                                    value={formik.values.message}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                />
                                <div className="contact-form__meta">
                                    {hasError("message") ? (
                                        <span className="contact-form__error">{formik.errors.message}</span>
                                    ) : (
                                        <span></span>
                                    )}
                                    <span className="contact-form__counter">
                                        {formik.values.message.length}/1000
                                    </span>
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                className="contact-form__submit"
                                disabled={formik.isSubmitting}
                                whileHover={{ scale: formik.isSubmitting ? 1 : 1.02 }}
                                whileTap={{ scale: formik.isSubmitting ? 1 : 0.97 }}
                            >
                                {formik.isSubmitting ? (
                                    <>
                                        <span className="contact-form__spinner"></span> Sending...
                                    </>
                                ) : (
                                    <>
                                        <FiSend /> Send Message
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;