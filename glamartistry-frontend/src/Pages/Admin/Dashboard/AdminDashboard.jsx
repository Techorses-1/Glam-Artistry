import React, { useEffect, useState } from "react";
import {
  FiDollarSign,
  FiShoppingBag,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiPackage,
  FiLayers,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AdminDashboard.scss";

const API = import.meta.env.VITE_API_URL;

const AdminDashboard = () => {
  const [range, setRange] = useState("month"); // "month" | "all"

  const [stats, setStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [ordersStatus, setOrdersStatus] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  // Fetch all dashboard data in parallel
  const fetchAll = async (currentRange) => {
    setLoading(true);
    try {
      const endpoints = [
        { key: "stats", url: `/admin/dashboard/stats?range=${currentRange}` },
        { key: "revenueChart", url: `/admin/dashboard/revenue-chart` },
        { key: "ordersStatus", url: `/admin/dashboard/orders-status?range=${currentRange}` },
        { key: "recentOrders", url: `/admin/dashboard/recent-orders` },
        { key: "lowStock", url: `/admin/dashboard/low-stock` },
        { key: "topProducts", url: `/admin/dashboard/top-products?range=${currentRange}` },
      ];

      const responses = await Promise.all(
        endpoints.map((e) =>
          fetch(`${API}${e.url}`, { credentials: "include" }).then((r) => r.json())
        )
      );

      responses.forEach((res, i) => {
        if (!res.success) {
          console.warn(`Failed: ${endpoints[i].key}`, res.message);
          return;
        }
        switch (endpoints[i].key) {
          case "stats": setStats(res.data); break;
          case "revenueChart": setRevenueChart(res.data); break;
          case "ordersStatus": setOrdersStatus(res.data); break;
          case "recentOrders": setRecentOrders(res.data); break;
          case "lowStock": setLowStock(res.data); break;
          case "topProducts": setTopProducts(res.data); break;
        }
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(range);
  }, [range]);

  const formatCurrency = (n) =>
    `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (loading && !stats) {
    return (
      <div className="ad">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="ad__loading">
          <div className="ad__spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ad">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* HEADER */}
      <div className="ad__header">
        <div>
          <h1>Dashboard</h1>
          <p className="ad__subtitle">Welcome back, Admin</p>
        </div>

        <div className="ad__range-toggle">
          <button
            className={range === "month" ? "active" : ""}
            onClick={() => setRange("month")}
          >
            This Month
          </button>
          <button
            className={range === "all" ? "active" : ""}
            onClick={() => setRange("all")}
          >
            All Time
          </button>
        </div>
      </div>

      {/* METRIC TILES */}
      <div className="ad__tiles">
        <Tile icon={<FiDollarSign />} label="Total Revenue" value={formatCurrency(stats?.totalRevenue)} color="#2AB453" />
        <Tile icon={<FiShoppingBag />} label="Total Orders" value={stats?.totalOrders || 0} color="#2b2664" />
        <Tile icon={<FiClock />} label="Pending Orders" value={stats?.pendingOrders || 0} color="#f5a623" />
        <Tile icon={<FiCheckCircle />} label="Delivered" value={stats?.deliveredOrders || 0} color="#2AB453" />
        <Tile icon={<FiXCircle />} label="Cancelled" value={stats?.cancelledOrders || 0} color="#e53935" />
        <Tile icon={<FiUsers />} label="Total Users" value={stats?.totalUsers || 0} color="#4a90e2" />
        <Tile icon={<FiPackage />} label="Products" value={stats?.totalProducts || 0} color="#9b59b6" />
        <Tile icon={<FiLayers />} label="Variations" value={stats?.totalVariations || 0} color="#00bcd4" />
      </div>

      {/* CHARTS ROW */}
      <div className="ad__charts-row">
        <div className="ad__chart-card ad__chart-card--wide">
          <h3>Revenue — Last 12 Months</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" fontSize={12} stroke="#888" />
              <YAxis fontSize={12} stroke="#888" />
              <Tooltip
                formatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                contentStyle={{ borderRadius: 8, border: "1px solid #eee" }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2b2664"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#2b2664" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="ad__chart-card">
          <h3>Orders by Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={ordersStatus}
                dataKey="count"
                nameKey="label"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {ordersStatus.map((entry) => (
                  <Cell key={entry.status} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #eee" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LISTS ROW */}
      <div className="ad__lists-row">
        {/* Recent Orders */}
        <div className="ad__list-card">
          <h3>Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="ad__empty">No recent orders</p>
          ) : (
            <div className="ad__list">
              {recentOrders.map((o) => (
                <div key={o.orderId} className="ad__list-item">
                  <div className="ad__list-item-main">
                    <span className="ad__list-id">{o.orderId}</span>
                    <span className="ad__list-sub">
                      {o.shippingAddress?.fullName || o.userId?.name || "-"}
                    </span>
                  </div>
                  <div className="ad__list-item-side">
                    <span className="ad__list-amount">{formatCurrency(o.total)}</span>
                    <span className={`ad__status ad__status--${o.orderStatus}`}>
                      {o.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="ad__list-card">
          <h3>Low Stock Alerts</h3>
          {lowStock.length === 0 ? (
            <p className="ad__empty">All good — no low stock</p>
          ) : (
            <div className="ad__list">
              {lowStock.map((item) => (
                <div key={`${item.productId}-${item.variationId}`} className="ad__list-item">
                  <img src={item.thumbnail} alt={item.productName} className="ad__list-thumb" />
                  <div className="ad__list-item-main">
                    <span className="ad__list-id">{item.productName}</span>
                    <span className="ad__list-sub">{item.designName}</span>
                  </div>
                  <div className="ad__list-item-side">
                    <span className="ad__stock-low">{item.stock} left</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="ad__list-card">
          <h3>Top Selling Products</h3>
          {topProducts.length === 0 ? (
            <p className="ad__empty">No sales yet</p>
          ) : (
            <div className="ad__list">
              {topProducts.map((p, i) => (
                <div key={p._id} className="ad__list-item">
                  <span className="ad__rank">#{i + 1}</span>
                  <img src={p.thumbnail} alt={p.productName} className="ad__list-thumb" />
                  <div className="ad__list-item-main">
                    <span className="ad__list-id">{p.productName}</span>
                    <span className="ad__list-sub">{p.totalQty} sold</span>
                  </div>
                  <div className="ad__list-item-side">
                    <span className="ad__list-amount">{formatCurrency(p.totalRevenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Tile Component ───
const Tile = ({ icon, label, value, color }) => (
  <div className="ad__tile">
    <div className="ad__tile-icon" style={{ background: `${color}15`, color }}>
      {icon}
    </div>
    <div className="ad__tile-info">
      <span className="ad__tile-label">{label}</span>
      <span className="ad__tile-value">{value}</span>
    </div>
  </div>
);

export default AdminDashboard;