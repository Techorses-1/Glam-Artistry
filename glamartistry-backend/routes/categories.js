const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const authAdmin = require("../middleware/authAdmin");

const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// ========== MAIN CATEGORY APIs ==========

// CREATE MAIN CATEGORY
// POST /api/categories/main/create
router.post("/main/create", authAdmin, async (req, res) => {
    try {
        let { name, image, status } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }

        name = name.toLowerCase().trim();

        const existing = await Category.findOne({ name, type: "main" });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Main category "${capitalizeFirstLetter(name)}" already exists`
            });
        }

        const category = await Category.create({
            name,
            type: "main",
            image: image || "",
            status: status || "active",
        });

        res.status(201).json({
            success: true,
            message: "Main category created",
            data: { ...category.toObject(), displayName: capitalizeFirstLetter(category.name) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET ALL MAIN CATEGORIES
// GET /api/categories/main/get-all
router.get("/main/get-all", authAdmin, async (req, res) => {
    try {
        const categories = await Category.find({ type: "main" }).sort({ createdAt: -1 });
        const formatted = categories.map(cat => ({
            ...cat.toObject(),
            displayName: capitalizeFirstLetter(cat.name)
        }));
        res.json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET SINGLE MAIN CATEGORY
// GET /api/categories/main/get/:id
router.get("/main/get/:id", authAdmin, async (req, res) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, type: "main" });
        if (!category) {
            return res.status(404).json({ success: false, message: "Main category not found" });
        }
        res.json({
            success: true,
            data: { ...category.toObject(), displayName: capitalizeFirstLetter(category.name) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE MAIN CATEGORY
// PUT /api/categories/main/update/:id
router.put("/main/update/:id", authAdmin, async (req, res) => {
    try {
        let { name, image, status } = req.body;
        const existing = await Category.findOne({ _id: req.params.id, type: "main" });

        if (!existing) {
            return res.status(404).json({ success: false, message: "Main category not found" });
        }

        if (name) {
            name = name.toLowerCase().trim();
            const duplicate = await Category.findOne({ name, type: "main", _id: { $ne: req.params.id } });
            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: `Main category "${capitalizeFirstLetter(name)}" already exists`
                });
            }
            existing.name = name;
        }

        if (image !== undefined) existing.image = image;
        if (status !== undefined) existing.status = status;

        await existing.save();

        res.json({
            success: true,
            message: "Main category updated",
            data: { ...existing.toObject(), displayName: capitalizeFirstLetter(existing.name) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE MAIN CATEGORY
// DELETE /api/categories/main/delete/:id
router.delete("/main/delete/:id", authAdmin, async (req, res) => {
    try {
        const category = await Category.findOneAndDelete({ _id: req.params.id, type: "main" });
        if (!category) {
            return res.status(404).json({ success: false, message: "Main category not found" });
        }
        res.json({ success: true, message: "Main category deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== SUB CATEGORY APIs ==========

// CREATE SUB CATEGORY
// POST /api/categories/sub/create
router.post("/sub/create", authAdmin, async (req, res) => {
    try {
        let { name, image, status } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }

        name = name.toLowerCase().trim();

        const existing = await Category.findOne({ name, type: "sub" });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Sub category "${capitalizeFirstLetter(name)}" already exists`
            });
        }

        const category = await Category.create({
            name,
            type: "sub",
            image: image || "",
            status: status || "active",
        });

        res.status(201).json({
            success: true,
            message: "Sub category created",
            data: { ...category.toObject(), displayName: capitalizeFirstLetter(category.name) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET ALL SUB CATEGORIES
// GET /api/categories/sub/get-all
router.get("/sub/get-all", authAdmin, async (req, res) => {
    try {
        const categories = await Category.find({ type: "sub" }).sort({ createdAt: -1 });
        const formatted = categories.map(cat => ({
            ...cat.toObject(),
            displayName: capitalizeFirstLetter(cat.name)
        }));
        res.json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET SINGLE SUB CATEGORY
// GET /api/categories/sub/get/:id
router.get("/sub/get/:id", authAdmin, async (req, res) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, type: "sub" });
        if (!category) {
            return res.status(404).json({ success: false, message: "Sub category not found" });
        }
        res.json({
            success: true,
            data: { ...category.toObject(), displayName: capitalizeFirstLetter(category.name) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE SUB CATEGORY
// PUT /api/categories/sub/update/:id
router.put("/sub/update/:id", authAdmin, async (req, res) => {
    try {
        let { name, image, status } = req.body;
        const existing = await Category.findOne({ _id: req.params.id, type: "sub" });

        if (!existing) {
            return res.status(404).json({ success: false, message: "Sub category not found" });
        }

        if (name) {
            name = name.toLowerCase().trim();
            const duplicate = await Category.findOne({ name, type: "sub", _id: { $ne: req.params.id } });
            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: `Sub category "${capitalizeFirstLetter(name)}" already exists`
                });
            }
            existing.name = name;
        }

        if (image !== undefined) existing.image = image;
        if (status !== undefined) existing.status = status;

        await existing.save();

        res.json({
            success: true,
            message: "Sub category updated",
            data: { ...existing.toObject(), displayName: capitalizeFirstLetter(existing.name) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE SUB CATEGORY
// DELETE /api/categories/sub/delete/:id
router.delete("/sub/delete/:id", authAdmin, async (req, res) => {
    try {
        const category = await Category.findOneAndDelete({ _id: req.params.id, type: "sub" });
        if (!category) {
            return res.status(404).json({ success: false, message: "Sub category not found" });
        }
        res.json({ success: true, message: "Sub category deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;