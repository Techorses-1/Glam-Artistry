const jwt = require("jsonwebtoken");

const authAdmin = (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.adminToken;

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if role is admin
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Attach admin info to request
    req.admin = {
      id: decoded.id,
      adminId: decoded.adminId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = authAdmin;