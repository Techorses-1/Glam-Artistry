import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    FiSearch, FiHeart, FiShoppingCart, FiUser, FiChevronDown
} from "react-icons/fi";
import logo from "../../assets/logo/logo.png";
import "./Navbar.scss";
import CartSidebar from "../../Pages/Cart/CartSidebar";

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showCartSidebar, setShowCartSidebar] = useState(false);
    const menuRef = useRef(null);
    const hamburgerRef = useRef(null);
    const dropdownRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Check if user is logged in
    const checkAuth = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile`, {
                credentials: "include",
            });
            setIsLoggedIn(response.ok);
        } catch {
            setIsLoggedIn(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, [location]);

    // Lock scroll when menu open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                menuOpen &&
                menuRef.current &&
                !menuRef.current.contains(e.target) &&
                hamburgerRef.current &&
                !hamburgerRef.current.contains(e.target)
            ) {
                setMenuOpen(false);
            }
            if (
                dropdownOpen &&
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen, dropdownOpen]);

    // Close dropdown on route change
    useEffect(() => {
        setDropdownOpen(false);
        setMenuOpen(false);
    }, [location]);

    // Handle protected navigation
    const handleProtectedNavigation = (path) => {
        if (isLoggedIn) {
            navigate(path);
        } else {
            navigate("/login");
        }
    };

    // Handle cart click - opens sidebar instead of navigating
    const handleCartClick = () => {
        if (isLoggedIn) {
            setShowCartSidebar(true);
        } else {
            navigate("/login");
        }
    };

    // Check if any products subpage is active
    const isProductsActive = location.pathname === "/drinkware" || location.pathname === "/kitchenware";

    return (
        <>
            {/* TOP BAR */}
            <div className="navbar-topbar">
                <p>" UP TO 50% OFF - LIMITED TIME ONLY! HURRY UP! "</p>
            </div>

            {/* MAIN NAV */}
            <nav className="navbar-main">
                <div className="navbar-container">

                    {/* LOGO */}
                    <div className="navbar-logo">
                        <NavLink to="/">
                            <img src={logo} alt="logo" />
                        </NavLink>
                    </div>

                    {/* DESKTOP LINKS */}
                    <ul className="navbar-links">
                        <li><NavLink to="/" className="navbar-link">HOME</NavLink></li>

                        {/* PRODUCTS DROPDOWN */}
                        <li
                            className={`navbar-dropdown ${dropdownOpen ? "active" : ""}`}
                            ref={dropdownRef}
                        >
                            <div
                                className={`navbar-dropdown-trigger ${isProductsActive ? "active-parent" : ""}`}
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <span>PRODUCTS</span>
                                <FiChevronDown className={`dropdown-icon ${dropdownOpen ? "rotate" : ""}`} />
                            </div>
                            <ul className="navbar-dropdown-menu">
                                <li>
                                    <NavLink
                                        to="/drinkware"
                                        className="dropdown-link"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        Drinkware
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/kitchenware"
                                        className="dropdown-link"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        Kitchenware
                                    </NavLink>
                                </li>
                            </ul>
                        </li>

                        <li><NavLink to="/contact" className="navbar-link">CONTACT</NavLink></li>
                        <li><NavLink to="/gifts" className="navbar-link">GIFTS</NavLink></li>
                    </ul>

                    {/* DESKTOP ICONS */}
                    <div className="navbar-icons">
                        <FiSearch />
                        <FiHeart onClick={() => handleProtectedNavigation("/wishlist")} />
                        <FiShoppingCart onClick={handleCartClick} />
                        <FiUser onClick={() => handleProtectedNavigation("/profile")} />
                    </div>

                    {/* HAMBURGER — uiverse animation */}
                    <button
                        ref={hamburgerRef}
                        className={`menu__icon navbar-hamburger ${menuOpen ? "is-open" : ""}`}
                        onClick={() => setMenuOpen((prev) => !prev)}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                </div>
            </nav>

            {/* OVERLAY */}
            {menuOpen && <div className="navbar-overlay" onClick={() => setMenuOpen(false)} />}

            {/* MOBILE MENU */}
            <div
                ref={menuRef}
                className={`navbar-mobile ${menuOpen ? "active" : ""}`}
            >
                {/* CLOSE BUTTON inside menu */}
                <div className="navbar-mobile-header">
                    <NavLink to="/" onClick={() => setMenuOpen(false)}>
                        <img src={logo} alt="logo" className="navbar-mobile-logo" />
                    </NavLink>
                    <button
                        className={`menu__icon ${menuOpen ? "is-open" : ""}`}
                        onClick={() => setMenuOpen(false)}
                        aria-label="Close menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>

                <ul className="navbar-mobile-links">
                    <li><NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink></li>

                    {/* MOBILE PRODUCTS SUBMENU */}
                    <li className="mobile-submenu">
                        <div className="mobile-submenu-title">Products</div>
                        <ul className="mobile-submenu-links">
                            <li>
                                <NavLink to="/drinkware" onClick={() => setMenuOpen(false)}>
                                    Drinkware
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/kitchenware" onClick={() => setMenuOpen(false)}>
                                    Kitchenware
                                </NavLink>
                            </li>
                        </ul>
                    </li>

                    <li><NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink></li>
                    <li><NavLink to="/gifts" onClick={() => setMenuOpen(false)}>Gifts</NavLink></li>
                </ul>

                {/* MOBILE ICONS */}
                <div className="navbar-mobile-icons">
                    <FiSearch />
                    <FiHeart onClick={() => {
                        setMenuOpen(false);
                        handleProtectedNavigation("/wishlist");
                    }} />
                    <FiShoppingCart onClick={() => {
                        setMenuOpen(false);
                        handleCartClick();
                    }} />
                    <FiUser onClick={() => {
                        setMenuOpen(false);
                        handleProtectedNavigation("/profile");
                    }} />
                </div>
            </div>

            {/* Cart Sidebar Component - Add this at the end */}
            {showCartSidebar && (
                <CartSidebar 
                    isOpen={showCartSidebar} 
                    onClose={() => setShowCartSidebar(false)} 
                />
            )}
        </>
    );
};

export default Navbar;