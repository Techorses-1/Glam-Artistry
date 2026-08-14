const jwt = require("jsonwebtoken");

const authUser = (req, res, next) => {

    console.log("🔐 Auth middleware called");
    console.log("Cookies received:", req.cookies);
    try {
        const token = req.cookies.userToken;
        console.log("Token present:", !!token);

        if (!token) {
            console.log("❌ No token found in cookies");
            return res.status(401).json({ success: false, message: "Access denied. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "user") {
            return res.status(403).json({ success: false, message: "Access denied. User only." });
        }

        req.user = {
            id: decoded.id,
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token expired" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = authUser;