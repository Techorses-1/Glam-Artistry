import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom"; // ← add Outlet
import AdminSidebar from "./AdminSidebar/AdminSidebar";
import "./AdminLayout.scss";

const AdminLayout = () => { // ← remove { children }
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/me`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          setLoading(false);
        } else {
          navigate("/admin/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate("/admin/login");
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading Admin Panel...</p>
      </div>
    );
  }

  return (
    <AdminSidebar>
      <main className="admin-main-content">
        <Outlet /> {/* ← this renders the child route */}
      </main>
    </AdminSidebar>
  );
};

export default AdminLayout;