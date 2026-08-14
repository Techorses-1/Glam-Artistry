const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const adminSchema = new mongoose.Schema({
  adminId: {
    type: String,
    unique: true,
    default: uuidv4,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin"],
    default: "admin",
  },
}, { timestamps: true });

module.exports = mongoose.model("Admin", adminSchema);