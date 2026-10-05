import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useLocation } from "react-router-dom";

import "./App.css";

// Pages

// Components
import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import ScrollToTop from "./Components/GoToTop/ScrollToTop";
import Home from "./Pages/Home/Home";
import Drinkware from "./Pages/Products/DrinkWare/Drinkware";
import Kitchenware from "./Pages/Products/KitchenWare/Kitchenware";
import AdminDashboard from "./Pages/Admin/Dashboard/AdminDashboard";
import AdminAuth from "./Pages/Admin/AdminAuth/AdminAuth";
import AdminLayout from "./Pages/Admin/AdminLayout/AdminLayout";
import CategoryManage from "./Pages/Admin/CategoryManage/CategoryManage";
import ProductManage from "./Pages/Admin/ProductManage/ProductManage";
import UserAuth from "./Pages/User/UserAuth/UserAuth";
import WishlistPage from "./Pages/Wishlist/WishlistPage";
import ProfilePage from "./Pages/User/Profile/ProfilePage";
import AdminInventory from "./Pages/Admin/Inventory/AdminInventory";
import ProductPage from "./Pages/ProductPage/ProductPage";
import CheckoutPage from "./Pages/Checkout/CheckoutPage";
import AdminOrders from "./Pages/Admin/OrderManage/AdminOrders";
import NotFound from "./Pages/404/NotFound";
import Contact from "./Pages/Contact/Contact";

// Wrapper component to conditionally show Navbar & Footer
const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname === "/login";  // ← ADD THIS LINE

  return (
    <>
      <ScrollToTop />
      {!isAdminRoute && !isLoginPage && <Navbar />}  {/* ← UPDATE THIS LINE */}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/drinkware" element={<Drinkware />} />
        <Route path="/kitchenware" element={<Kitchenware />} />

        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/profile" element={<ProfilePage />} />

         <Route path="/product/:productId" element={<ProductPage />} />\
         <Route path="/checkout" element={<CheckoutPage />} />


        {/* Admin Auth Route (No Layout) */}
        <Route path="/admin/login" element={<AdminAuth />} />
        <Route path="/login" element={<UserAuth />} />

        {/* Protected Admin Routes with Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="categories" element={<CategoryManage />} />
          <Route path="products" element={<ProductManage />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="orders" element={<AdminOrders />} />


        </Route>
      </Routes>

      {!isAdminRoute && !isLoginPage && <Footer />}  {/* ← UPDATE THIS LINE */}
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;