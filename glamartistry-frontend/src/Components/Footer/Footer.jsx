import React from "react";
import "./Footer.scss";
import { FiInstagram, FiFacebook, FiLinkedin, FiYoutube, FiMapPin } from "react-icons/fi";
import { motion, useInView } from "framer-motion";
import logo from "../../assets/logo/logo.png";

const Footer = () => {
  const sectionRef = React.useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const socialVariants = {
    hover: {
      scale: 1.15,
      y: -3,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    tap: {
      scale: 0.95
    }
  };

  const linkVariants = {
    hover: {
      x: 5,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  const handleContactClick = () => {
    window.location.href = "mailto:glamartistry@gmail.com";
  };

  const handleMapClick = () => {
    window.open("https://maps.google.com/?q=41+Luna+Rd+Taluko+Padra+District+Vadodara+391440+Gujarat", "_blank");
  };

  const handleTechorsesClick = () => {
    window.open("https://techorses.com", "_blank");
  };

  const handleSocialClick = (url) => {
    window.open(url, "_blank");
  };

  return (
    <motion.footer
      className="footer"
      ref={sectionRef}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <div className="footer-container">

        {/* LOGO + TAGLINE */}
        <motion.div className="footer-col footer-logo" variants={itemVariants}>
          <motion.img
            src={logo}
            alt="logo"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            onClick={() => window.location.href = "/"}
            style={{ cursor: "pointer" }}
          />
          <p>YOUR TABLE,<br />YOUR CANVAS!</p>
        </motion.div>

        {/* COMPANY */}
        <motion.div className="footer-col page-links" variants={itemVariants}>
          <h4>COMPANY</h4>
          <ul>
            <motion.li variants={linkVariants} whileHover="hover">
              <a href="/">Home</a>
            </motion.li>
            <motion.li variants={linkVariants} whileHover="hover">
              <a href="/contact">Contact</a>
            </motion.li>
            <motion.li variants={linkVariants} whileHover="hover">
              <a href="/gifts">Gifts</a>
            </motion.li>
          </ul>
        </motion.div>

        {/* PRODUCTS */}
        <motion.div className="footer-col" variants={itemVariants}>
          <h4>PRODUCTS</h4>
          <ul>
            <motion.li variants={linkVariants} whileHover="hover">
              <a href="/drinkware">Drinkware</a>
            </motion.li>
            <motion.li variants={linkVariants} whileHover="hover">
              <a href="/kitchenware">Kitchenware</a>
            </motion.li>
          </ul>
        </motion.div>

        {/* CONTACT */}
        <motion.div className="footer-col" variants={itemVariants}>
          <motion.p
            whileHover={{ x: 3 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.location.href = "tel:+911233456781"}
            style={{ cursor: "pointer" }}
          >
            +91 1233456781
          </motion.p>
          <motion.p
            whileHover={{ x: 3 }}
            transition={{ duration: 0.2 }}
            onClick={handleContactClick}
            style={{ cursor: "pointer" }}
          >
            glamartistry@gmail.com
          </motion.p>
          <motion.p
            whileHover={{ x: 3 }}
            transition={{ duration: 0.2 }}
            onClick={handleMapClick}
            style={{ cursor: "pointer" }}
          >
            {/* <FiMapPin size={14} style={{ marginRight: "5px" }} /> */}
            SayajiGanj Vadodara-391440, Gujarat.
          </motion.p>
        </motion.div>

      </div>

      {/* BOTTOM */}
      <motion.div className="footer-bottom" variants={itemVariants}>
        <div className="footer-copy">
          <p>Copyright © 2026 Glam Artistry, All Rights Reserved.</p>
          <p>
            Design and Developed by{" "}
            <motion.span
              whileHover={{ color: "#2ab453", cursor: "pointer" }}
              transition={{ duration: 0.2 }}
              onClick={handleTechorsesClick}
            >
              Techorses
            </motion.span>
          </p>
        </div>

        <div className="footer-social">
          <motion.div
            variants={socialVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleSocialClick("https://instagram.com")}
          >
            <FiInstagram />
          </motion.div>
          <motion.div
            variants={socialVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleSocialClick("https://facebook.com")}
          >
            <FiFacebook />
          </motion.div>
          <motion.div
            variants={socialVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleSocialClick("https://linkedin.com")}
          >
            <FiLinkedin />
          </motion.div>
          <motion.div
            variants={socialVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleSocialClick("https://youtube.com")}
          >
            <FiYoutube />
          </motion.div>
        </div>
      </motion.div>
    </motion.footer>
  );
};

export default Footer;
