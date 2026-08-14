import React from 'react';
import './AdminDashboard.scss';

const AdminDashboard = () => {
  // Stats data
  const stats = [
    { title: "Total Products", value: "0", icon: "📦", color: "#2b2664" },
    { title: "Total Categories", value: "0", icon: "📁", color: "#1a5f7a" },
    { title: "Total Orders", value: "0", icon: "🛒", color: "#e67e22" },
    { title: "Total Users", value: "0", icon: "👥", color: "#27ae60" },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, Admin! 👋</h1>
        <p>Here's what's happening with your store today.</p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        {stats.map((stat, index) => (
          <div className="stat-card" key={index} style={{ borderBottomColor: stat.color }}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="dashboard-recent">
        <div className="recent-header">
          <h2>Recent Activity</h2>
          <span className="coming-soon-badge">Coming Soon</span>
        </div>
        <div className="recent-placeholder">
          <p>No recent activity to display.</p>
          <p className="placeholder-sub">Start adding products and managing your store!</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;