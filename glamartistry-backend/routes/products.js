const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Category = require("../models/Category");
const Inventory = require("../models/Inventory");
const StockHistory = require("../models/StockHistory");
const authAdmin = require("../middleware/authAdmin");
const upload = require("../middleware/upload");
const { uploadToS3, uploadMultipleToS3, deleteFromS3, deleteMultipleFromS3 } = require("../utils/s3Upload");

// Helper function to parse JSON fields
const parseJSONField = (field) => {
    if (!field) return {};
    try {
        return typeof field === "string" ? JSON.parse(field) : field;
    } catch {
        return {};
    }
};

// Helper function to create inventory for a product
const createInventoryForProduct = async (productId, variations, updatedBy = "system") => {
    const inventoryItems = [];
    for (const variation of variations) {
        const inventory = new Inventory({
            productId,
            variationId: variation.variationId,
            stock: 0,
            lowStockThreshold: 10,
            lastUpdatedBy: updatedBy,
        });
        await inventory.save();
        inventoryItems.push(inventory);
    }
    return inventoryItems;
};

// Helper function to delete inventory for a product
const deleteInventoryForProduct = async (productId) => {
    await Inventory.deleteMany({ productId });
    await StockHistory.deleteMany({ productId });
};

// Helper function to delete inventory for a specific variation
const deleteInventoryForVariation = async (productId, variationId) => {
    await Inventory.deleteOne({ productId, variationId });
    await StockHistory.deleteOne({ productId, variationId });
};

// ========== CREATE PRODUCT ==========
router.post("/create", authAdmin, upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "variationImages", maxCount: 50 }
]), async (req, res) => {
    try {
        const { name, description, specifications, variations, mainCategory, subCategory } = req.body;
        const files = req.files;

        // Validation
        if (!name || !description || !mainCategory || !subCategory) {
            return res.status(400).json({ success: false, message: "All required fields must be filled" });
        }

        if (!files.thumbnail || files.thumbnail.length === 0) {
            return res.status(400).json({ success: false, message: "Thumbnail image is required" });
        }

        // Verify categories
        const mainCatExists = await Category.findOne({ name: mainCategory.toLowerCase(), type: "main" });
        const subCatExists = await Category.findOne({ name: subCategory.toLowerCase(), type: "sub" });

        if (!mainCatExists || !subCatExists) {
            return res.status(400).json({ success: false, message: "Invalid main category or sub category" });
        }

        // Parse variations
        let parsedVariations = parseJSONField(variations);
        if (!Array.isArray(parsedVariations) || parsedVariations.length === 0) {
            return res.status(400).json({ success: false, message: "At least one variation is required" });
        }

        const productId = `PROD-${Date.now()}`;

        // Upload thumbnail
        const thumbnailUrl = await uploadToS3(files.thumbnail[0], `products/${productId}/thumbnail`);

        // Process variations and upload images
        const variationImages = files.variationImages || [];
        const processedVariations = [];
        let imageIndex = 0;

        for (let i = 0; i < parsedVariations.length; i++) {
            const variation = parsedVariations[i];

            const variationImageFiles = variationImages.slice(imageIndex, imageIndex + (variation.imagesCount || 0));
            imageIndex += (variation.imagesCount || 0);

            let imageUrls = [];
            if (variationImageFiles.length > 0) {
                imageUrls = await uploadMultipleToS3(variationImageFiles, `products/${productId}/variations/${i}`);
            }

            processedVariations.push({
                variationId: variation.variationId || `VAR-${Date.now()}-${i}`,
                designName: variation.designName,
                sellingPrice: Number(variation.sellingPrice),
                originalPrice: Number(variation.originalPrice),
                images: imageUrls,
            });
        }

        // Parse specifications
        const parsedSpecifications = parseJSONField(specifications);

        // Create product
        const product = new Product({
            productId,
            name,
            description,
            specifications: parsedSpecifications,
            thumbnail: thumbnailUrl,
            mainCategory: mainCategory.toLowerCase(),
            subCategory: subCategory.toLowerCase(),
            variations: processedVariations,
        });

        await product.save();

        // ✅ CREATE INVENTORY FOR EACH VARIATION
        await createInventoryForProduct(productId, processedVariations, req.admin?.email || "system");

        res.status(201).json({
            success: true,
            message: "Product created successfully with inventory",
            data: product,
        });
    } catch (error) {
        console.error("Create product error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET ALL PRODUCTS ==========
router.get("/get-all", async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", mainCategory, subCategory } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = {};
        if (search) {
            query = { name: { $regex: search, $options: "i" } };
        }
        if (mainCategory) {
            query.mainCategory = mainCategory.toLowerCase();
        }
        if (subCategory) {
            query.subCategory = subCategory.toLowerCase();
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .select("productId name thumbnail description createdAt variations mainCategory subCategory")
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .lean(),
            Product.countDocuments(query),
        ]);

        // Get inventory for each product to show stock
        const productsWithPrices = await Promise.all(products.map(async (p) => {
            const inventories = await Inventory.find({ productId: p.productId });
            const inventoryMap = {};
            inventories.forEach(inv => {
                inventoryMap[inv.variationId] = inv.stock;
            });

            return {
                productId: p.productId,
                name: p.name,
                thumbnail: p.thumbnail,
                description: p.description,
                createdAt: p.createdAt,
                mainCategory: p.mainCategory,
                subCategory: p.subCategory,
                variationsCount: p.variations.length,
                minPrice: p.variations.length > 0 ? Math.min(...p.variations.map((v) => v.sellingPrice)) : 0,
                originalPrice: p.variations.length > 0 ? p.variations[0].originalPrice : 0,
                variations: p.variations.map(v => ({
                    ...v,
                    stock: inventoryMap[v.variationId] || 0
                })),
            };
        }));

        res.json({
            success: true,
            data: productsWithPrices,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET SINGLE PRODUCT ==========
router.get("/get/:id", async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.id }).lean();
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Get inventory for each variation
        const inventories = await Inventory.find({ productId: product.productId });
        const inventoryMap = {};
        inventories.forEach(inv => {
            inventoryMap[inv.variationId] = inv.stock;
        });

        const productWithStock = {
            ...product,
            variations: product.variations.map(v => ({
                ...v,
                stock: inventoryMap[v.variationId] || 0
            })),
        };

        res.json({ success: true, data: productWithStock });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put("/update/:id", authAdmin, upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "variationImages", maxCount: 50 }
]), async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.id });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const { name, description, specifications, variations, mainCategory, subCategory, removedVariationImages, removedVariationIds } = req.body;
        const files = req.files;
        const adminEmail = req.admin?.email || "system";

        // 🔍 DEBUG LOGS
        console.log("========== UPDATE PRODUCT ==========");
        console.log("Product ID:", req.params.id);
        console.log("Received variations:", variations);
        console.log("Received variationImages count:", files.variationImages?.length || 0);
        console.log("Files received:", Object.keys(files || {}));

        // Update thumbnail if new one uploaded
        if (files.thumbnail && files.thumbnail.length > 0) {
            if (product.thumbnail) await deleteFromS3(product.thumbnail);
            const newThumbnailUrl = await uploadToS3(files.thumbnail[0], `products/${product.productId}/thumbnail`);
            product.thumbnail = newThumbnailUrl;
            console.log("Thumbnail updated");
        }

        // Update categories
        if (mainCategory) {
            const mainCatExists = await Category.findOne({ name: mainCategory.toLowerCase(), type: "main" });
            if (!mainCatExists) {
                return res.status(400).json({ success: false, message: "Invalid main category" });
            }
            product.mainCategory = mainCategory.toLowerCase();
        }

        if (subCategory) {
            const subCatExists = await Category.findOne({ name: subCategory.toLowerCase(), type: "sub" });
            if (!subCatExists) {
                return res.status(400).json({ success: false, message: "Invalid sub category" });
            }
            product.subCategory = subCategory.toLowerCase();
        }

        // Update basic fields
        if (name) product.name = name;
        if (description) product.description = description;
        if (specifications) product.specifications = parseJSONField(specifications);

        // Delete removed images from S3
        if (removedVariationImages) {
            const imagesToDelete = parseJSONField(removedVariationImages);
            if (Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
                await deleteMultipleFromS3(imagesToDelete);
                console.log(`Deleted ${imagesToDelete.length} images from S3`);
            }
        }

        // ✅ DELETE INVENTORY FOR REMOVED VARIATIONS
        if (removedVariationIds) {
            const removedIds = parseJSONField(removedVariationIds);
            if (Array.isArray(removedIds) && removedIds.length > 0) {
                for (const variationId of removedIds) {
                    await deleteInventoryForVariation(product.productId, variationId);
                }
                console.log(`Deleted inventory for ${removedIds.length} removed variations`);
            }
        }

        // Process variations
        if (variations) {
            let parsedVariations = parseJSONField(variations);
            console.log("Parsed variations array length:", parsedVariations.length);

            if (Array.isArray(parsedVariations)) {
                const variationImages = files.variationImages || [];
                console.log("Variation images array length:", variationImages.length);

                let imageIndex = 0;
                const processedVariations = [];

                for (let i = 0; i < parsedVariations.length; i++) {
                    const variation = parsedVariations[i];

                    console.log(`\n--- Processing variation ${i} ---`);
                    console.log("Variation data:", {
                        designName: variation.designName,
                        existingImagesCount: variation.existingImages?.length || 0,
                        newImagesCount: variation.newImagesCount || 0,
                        variationId: variation.variationId || "NEW"
                    });

                    const newImageFiles = variationImages.slice(imageIndex, imageIndex + (variation.newImagesCount || 0));
                    console.log(`New images for this variation: ${newImageFiles.length} files`);

                    imageIndex += (variation.newImagesCount || 0);

                    let imageUrls = variation.existingImages || [];
                    if (newImageFiles.length > 0) {
                        console.log(`Uploading ${newImageFiles.length} images to S3...`);
                        const newUrls = await uploadMultipleToS3(newImageFiles, `products/${product.productId}/variations/${i}`);
                        imageUrls = [...imageUrls, ...newUrls];
                        console.log(`Uploaded URLs: ${newUrls.length}`);
                    }

                    const variationId = variation.variationId || `VAR-${Date.now()}-${i}`;

                    processedVariations.push({
                        variationId,
                        designName: variation.designName,
                        sellingPrice: Number(variation.sellingPrice),
                        originalPrice: Number(variation.originalPrice),
                        images: imageUrls,
                    });

                    console.log(`Final images count for ${variation.designName}: ${imageUrls.length}`);

                    // ✅ CREATE INVENTORY FOR NEW VARIATION (if doesn't exist)
                    const existingInventory = await Inventory.findOne({ productId: product.productId, variationId });
                    if (!existingInventory) {
                        const newInventory = new Inventory({
                            productId: product.productId,
                            variationId,
                            stock: 0,
                            lowStockThreshold: 10,
                            lastUpdatedBy: adminEmail,
                        });
                        await newInventory.save();
                        console.log(`Created inventory for new variation: ${variation.designName}`);
                    }
                }

                product.variations = processedVariations;
                console.log("\n========== UPDATE COMPLETE ==========");
                console.log(`Total processed variations: ${processedVariations.length}`);
                console.log(`Total images uploaded: ${imageIndex}`);
            }
        }

        await product.save();
        console.log("Product saved to database");

        res.json({
            success: true,
            message: "Product updated successfully",
            data: product,
        });
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== DELETE PRODUCT ==========
router.delete("/delete/:id", authAdmin, async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.id });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Delete images from S3
        if (product.thumbnail) await deleteFromS3(product.thumbnail);
        const allVariationImages = product.variations.flatMap((v) => v.images);
        if (allVariationImages.length > 0) await deleteMultipleFromS3(allVariationImages);

        // ✅ DELETE INVENTORY AND STOCK HISTORY FOR THIS PRODUCT
        await deleteInventoryForProduct(product.productId);

        // Delete product from database
        await Product.deleteOne({ productId: req.params.id });

        res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;