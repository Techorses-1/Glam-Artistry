import React, { useState, useEffect } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import { GiHamburgerMenu } from "react-icons/gi";
import { RxCross1 } from "react-icons/rx";
import {
    FiGrid,
    FiPackage,
    FiShoppingCart,
    FiUsers,
} from "react-icons/fi";
import { MdOutlineDashboard } from "react-icons/md";
import "./AdminSidebar.scss";

const AdminSidebar = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false); // For desktop: collapsed or expanded
    const [isMobileOpen, setIsMobileOpen] = useState(false); // For mobile: sidebar open or closed
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Check screen size
    useEffect(() => {
        const checkScreenSize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) {
                setIsMobileOpen(false); // Mobile: sidebar closed by default
            } else {
                setIsCollapsed(false); // Desktop: expanded by default
            }
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    // Close mobile sidebar on route change
    useEffect(() => {
        if (isMobile) {
            setIsMobileOpen(false);
        }
    }, [location.pathname, isMobile]);

    const handleToggle = () => {
        if (isMobile) {
            setIsMobileOpen(!isMobileOpen); // Mobile: open/close sidebar
        } else {
            setIsCollapsed(!isCollapsed); // Desktop: collapse/expand sidebar
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/logout`, {
                method: "POST",
                credentials: "include",
            });
            if (response.ok) {
                navigate("/admin/login");
            }
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const menuData = [
        { icon: <MdOutlineDashboard />, title: "Dashboard", path: "/admin/dashboard" },
        { icon: <FiGrid />, title: "Categories", path: "/admin/categories" },
        { icon: <FiPackage />, title: "Products", path: "/admin/products" },
        { icon: <FiShoppingCart />, title: "Orders", path: "/admin/orders" },
        { icon: <FiShoppingCart />, title: "Inventory", path: "/admin/inventory" },
        { icon: <FiUsers />, title: "Users", path: "/admin/users" },
    ];

    return (
        <div className="admin-layout">
            {/* Mobile Hamburger Button - TOP LEFT (only visible on mobile when sidebar is closed) */}
            {isMobile && !isMobileOpen && (
                <button className="admin-mobile-hamburger" onClick={handleToggle}>
                    <GiHamburgerMenu />
                </button>
            )}

            {/* Sidebar */}
            <aside
                className={`admin-sidebar 
                    ${isMobile ? (isMobileOpen ? "mobile-open" : "mobile-closed") : ""}
                    ${!isMobile && isCollapsed ? "desktop-collapsed" : ""}
                `}
            >
                <div className="admin-sidebar-header">
                    <div className="admin-logo">
                        {/* Show logo text only when sidebar is expanded on desktop OR open on mobile */}
                        {(!isMobile && !isCollapsed) || (isMobile && isMobileOpen) ? (
                            <span className="admin-logo-text">Admin Panel</span>
                        ) : null}
                        <button className="admin-toggle-btn" onClick={handleToggle}>
                            {isMobile ? (
                                <RxCross1 />
                            ) : (
                                isCollapsed ? <GiHamburgerMenu /> : <RxCross1 />
                            )}
                        </button>
                    </div>
                </div>

                <nav className="admin-nav">
                    <ul className="admin-menu">
                        {menuData.map((item, index) => (
                            <li key={index}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => (isActive ? "active" : "")}
                                >
                                    <span className="admin-menu-icon">{item.icon}</span>
                                    {/* Show text only when sidebar is expanded on desktop OR open on mobile */}
                                    {(!isMobile && !isCollapsed) || (isMobile && isMobileOpen) ? (
                                        <span className="admin-menu-title">{item.title}</span>
                                    ) : null}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="admin-sidebar-footer">
                    {/* Show footer text only when sidebar is expanded on desktop OR open on mobile */}
                    {(!isMobile && !isCollapsed) || (isMobile && isMobileOpen) ? (
                        <>
                            <p>Designed & Developed By</p>
                            <span>Techorses</span>
                        </>
                    ) : null}
                    <button className="admin-logout-btn" onClick={handleLogout}>
                        <BiLogOut />
                        {(!isMobile && !isCollapsed) || (isMobile && isMobileOpen) ? (
                            <span>Logout</span>
                        ) : null}
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile when sidebar is open */}
            {isMobile && isMobileOpen && (
                <div className="admin-overlay" onClick={handleToggle}></div>
            )}

            {/* Main Content */}
            <div className={`admin-content ${isMobile ? "mobile" : (isCollapsed ? "expanded" : "")}`}>
                {children}
            </div>
        </div>
    );
};

export default AdminSidebar;