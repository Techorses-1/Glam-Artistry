const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/mongodb");

dotenv.config();

const app = express();

// ================= CORS =================
const allowedOrigins = [
    "http://localhost:5173",
    "https://glamartistry.vercel.app",
    "https://8xqpg579-5173.inc1.devtunnels.ms",
    "https://buyglamartistry.com",
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (Postman/mobile apps)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ================= DATABASE =================
connectDB();

// ================= ROUTES =================
const adminRoutes = require("./routes/admin");
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");
const wishlistRoutes = require("./routes/wishlist");
const addressRoutes = require("./routes/address");
const inventoryRoutes = require("./routes/inventory");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const reviewRoutes = require("./routes/reviewRoutes");
const adminDashboardRoutes = require("./routes/adminDashboard");
const contactRoutes = require("./routes/contact");


// ================= API ROUTES =================
app.use("/admin", adminRoutes);
app.use("/categories", categoryRoutes);
app.use("/products", productRoutes);
app.use("/users", userRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/address", addressRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/reviews", reviewRoutes);
app.use("/admin/dashboard", adminDashboardRoutes);
app.use("/contact", contactRoutes);

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
    res.send(" New GLAM ARTISTRY Backend Updated Running...");
});

// ================= 404 HANDLER =================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        success: false,
        message: err.message || "Something went wrong!",
    });
});

// ================= SERVER =================
const PORT = process.env.PORT || 3070;

app.listen(PORT, () => {
    console.log(`🔥 Server running on port ${PORT}`);
});
