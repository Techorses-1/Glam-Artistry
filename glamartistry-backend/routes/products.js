const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Category = require("../models/Category");
const Inventory = require("../models/Inventory");
const StockHistory = require("../models/StockHistory");
const authAdmin = require("../middleware/authAdmin");
const upload = require("../middleware/upload");
const { uploadToS3, uploadMultipleToS3, deleteFromS3, deleteMultipleFromS3 } = require("../utils/s3Upload");

// ========== HELPERS ==========

// Parse JSON fields safely
const parseJSONField = (field) => {
    if (!field) return {};
    try {
        return typeof field === "string" ? JSON.parse(field) : field;
    } catch {
        return {};
    }
};

// ✅ NEW: Generate a URL-safe slug from a product name
const generateSlugBase = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")   // remove special chars (keep letters, numbers, space, dash)
        .replace(/\s+/g, "-")           // spaces → dash
        .replace(/-+/g, "-")            // multiple dashes → single
        .replace(/^-|-$/g, "");         // trim leading/trailing dashes
};

// ✅ NEW: Generate a UNIQUE slug (adds -1, -2 if duplicate)
const generateUniqueSlug = async (name, excludeProductId = null) => {
    const base = generateSlugBase(name);
    if (!base) return `product-${Date.now()}`;   // safety fallback

    let slug = base;
    let counter = 1;

    while (true) {
        const query = { slug };
        if (excludeProductId) query.productId = { $ne: excludeProductId };

        const exists = await Product.findOne(query).lean();
        if (!exists) return slug;

        slug = `${base}-${counter}`;
        counter++;
    }
};

// Create inventory for each variation
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

// Delete inventory for a product
const deleteInventoryForProduct = async (productId) => {
    await Inventory.deleteMany({ productId });
    await StockHistory.deleteMany({ productId });
};

// Delete inventory for a specific variation
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

        // ✅ GENERATE UNIQUE SLUG FROM NAME
        const slug = await generateUniqueSlug(name);
        console.log(`📝 Generated slug: "${slug}" for product "${name}"`);

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
            slug,                // ✅ SAVE SLUG
            name,
            description,
            specifications: parsedSpecifications,
            thumbnail: thumbnailUrl,
            mainCategory: mainCategory.toLowerCase(),
            subCategory: subCategory.toLowerCase(),
            variations: processedVariations,
        });

        await product.save();

        // Create inventory for each variation
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
        const { page = 1, limit = 10, search = "", mainCategory, subCategory, random } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);
        const isRandom = random === "true";

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

        let products;
        let total;

        if (isRandom) {
            products = await Product.aggregate([
                { $match: query },
                { $sample: { size: limitNum } },
                {
                    $project: {
                        productId: 1,
                        slug: 1,           // ✅ INCLUDE SLUG
                        name: 1,
                        thumbnail: 1,
                        description: 1,
                        createdAt: 1,
                        mainCategory: 1,
                        subCategory: 1,
                        variations: 1,
                    },
                },
            ]);
            total = products.length;
        } else {
            const [found, count] = await Promise.all([
                Product.find(query)
                    .select("productId slug name thumbnail description createdAt variations mainCategory subCategory")   // ✅ ADDED slug
                    .skip(skip)
                    .limit(limitNum)
                    .sort({ createdAt: -1 })
                    .lean(),
                Product.countDocuments(query),
            ]);
            products = found;
            total = count;
        }

        // Get inventory for each product
        const productsWithPrices = await Promise.all(products.map(async (p) => {
            const inventories = await Inventory.find({ productId: p.productId });
            const inventoryMap = {};
            inventories.forEach(inv => {
                inventoryMap[inv.variationId] = inv.stock;
            });

            return {
                productId: p.productId,
                slug: p.slug,              // ✅ RETURN SLUG
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
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                limit: limitNum,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET SINGLE PRODUCT (by slug OR productId) ==========
router.get("/get/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ Try slug first, then fallback to productId (backward compatibility)
        let product = await Product.findOne({ slug: id.toLowerCase() }).lean();
        if (!product) {
            product = await Product.findOne({ productId: id }).lean();
        }

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

// ========== UPDATE PRODUCT ==========
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

        // ✅ UPDATE NAME + REGENERATE SLUG ONLY IF NAME CHANGED
        if (name && name !== product.name) {
            console.log(`📝 Name changed: "${product.name}" → "${name}"`);
            console.log(`   Old slug: "${product.slug}"`);

            product.name = name;

            // Regenerate slug (unique, excluding this product)
            const newSlug = await generateUniqueSlug(name, product.productId);
            console.log(`   New slug: "${newSlug}"`);
            product.slug = newSlug;
        } else if (name && !product.slug) {
            // Safety: if product had no slug (existing data), generate one
            product.name = name;
            product.slug = await generateUniqueSlug(name, product.productId);
            console.log(`   Generated missing slug: "${product.slug}"`);
        }

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

        // Delete inventory for removed variations
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

                    // Create inventory for new variation (if doesn't exist)
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

        // Delete inventory and stock history
        await deleteInventoryForProduct(product.productId);

        // Delete product from database
        await Product.deleteOne({ productId: req.params.id });

        res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== 🆕 MIGRATION ROUTE (run ONCE to add slugs to old products) ==========
// POST /products/admin/migrate-slugs
router.post("/admin/migrate-slugs", authAdmin, async (req, res) => {
    try {
        const products = await Product.find({
            $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }]
        });

        console.log(`🔄 Migrating ${products.length} products without slug...`);

        let updated = 0;
        for (const product of products) {
            const slug = await generateUniqueSlug(product.name, product.productId);
            product.slug = slug;
            await product.save();
            updated++;
            console.log(`   ✓ "${product.name}" → "${slug}"`);
        }

        res.json({
            success: true,
            message: `Migration complete. ${updated} products updated.`,
            total: products.length,
            updated,
        });
    } catch (error) {
        console.error("Migration error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;