const express = require("express");
const router = express.Router();
const Address = require("../models/Address");
const authUser = require("../middleware/authUser");

// ========== GET ALL ADDRESSES ==========
// GET /address/get
router.get("/get", authUser, async (req, res) => {
    try {
        const addresses = await Address.find({ userId: req.user.id })
            .sort({ isDefault: -1, createdAt: -1 });

        res.json({
            success: true,
            data: addresses,
            count: addresses.length,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET SINGLE ADDRESS ==========
// GET /address/get/:id
router.get("/get/:id", authUser, async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        res.json({ success: true, data: address });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== CREATE ADDRESS ==========
// POST /address/create
router.post("/create", authUser, async (req, res) => {
    try {
        const {
            fullName,
            phone,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            landmark,
            addressType,
            isDefault,
        } = req.body;

        // Validation
        if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled"
            });
        }

        // If this is the first address or isDefault is true, handle default logic
        const existingAddresses = await Address.find({ userId: req.user.id });

        let shouldBeDefault = isDefault || false;
        if (existingAddresses.length === 0) {
            shouldBeDefault = true;
        }

        const address = await Address.create({
            userId: req.user.id,
            fullName,
            phone,
            addressLine1,
            addressLine2: addressLine2 || "",
            city,
            state,
            pincode,
            landmark: landmark || "",
            addressType: addressType || "home",
            isDefault: shouldBeDefault,
        });

        res.status(201).json({
            success: true,
            message: "Address added successfully",
            data: address,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== UPDATE ADDRESS ==========
// PUT /address/update/:id
router.put("/update/:id", authUser, async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        const {
            fullName,
            phone,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            landmark,
            addressType,
            isDefault,
        } = req.body;

        // Update fields
        if (fullName) address.fullName = fullName;
        if (phone) address.phone = phone;
        if (addressLine1) address.addressLine1 = addressLine1;
        if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
        if (city) address.city = city;
        if (state) address.state = state;
        if (pincode) address.pincode = pincode;
        if (landmark !== undefined) address.landmark = landmark;
        if (addressType) address.addressType = addressType;

        if (isDefault === true) {
            // Remove default from other addresses
            await Address.updateMany(
                { userId: req.user.id, _id: { $ne: address._id } },
                { isDefault: false }
            );
            address.isDefault = true;
        } else if (isDefault === false && address.isDefault) {
            address.isDefault = false;
        }

        await address.save();

        res.json({
            success: true,
            message: "Address updated successfully",
            data: address,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== DELETE ADDRESS ==========
// DELETE /address/delete/:id
router.delete("/delete/:id", authUser, async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        const wasDefault = address.isDefault;
        await Address.deleteOne({ _id: req.params.id });

        // If deleted address was default, set another address as default
        if (wasDefault) {
            const nextAddress = await Address.findOne({ userId: req.user.id })
                .sort({ createdAt: 1 });

            if (nextAddress) {
                nextAddress.isDefault = true;
                await nextAddress.save();
            }
        }

        res.json({
            success: true,
            message: "Address deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== SET DEFAULT ADDRESS ==========
// PUT /address/set-default/:id
router.put("/set-default/:id", authUser, async (req, res) => {
    try {
        // Remove default from all addresses
        await Address.updateMany(
            { userId: req.user.id },
            { isDefault: false }
        );

        // Set new default
        const address = await Address.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isDefault: true },
            { new: true }
        );

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        res.json({
            success: true,
            message: "Default address updated",
            data: address,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;