import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually if not in process.env
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      const val = values.join("=").trim().replace(/^["']|["']$/g, "");
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  });
}

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/next-auth-app";
const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "admin@yopmail.com"
).toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";
const ADMIN_NAME = process.env.ADMIN_NAME || "System Admin";

async function seedAdmin() {
  console.log("------------------------------------------");
  console.log("🌱 Starting Admin Seeding Script");
  console.log(`Connecting to MongoDB at: ${MONGODB_URI.split("@").pop()}`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully.");

    // Check if an admin already exists (by email or admin role)
    const existingAdmin = await User.findOne({
      $or: [{ email: ADMIN_EMAIL }, { role: "admin" }],
    });

    if (existingAdmin) {
      console.log("------------------------------------------");
      console.log(`⚠️  Admin already exists!`);
      console.log(`Email: ${existingAdmin.email} | Role: ${existingAdmin.role} | Active: ${existingAdmin.isActive}`);
      console.log("No changes were made. Seed aborted because an admin already exists.");
      console.log("------------------------------------------");
      await mongoose.disconnect();
      process.exit(0);
    }

    // If no admin exists, create one
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const newAdmin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
      isActive: true,
      isVerified: true,
    });

    console.log(`✅ Created new Admin account successfully!`);
    console.log("==========================================");
    console.log(" Admin Credentials:");
    console.log(` Email:    ${newAdmin.email}`);
    console.log(` Password: ${ADMIN_PASSWORD}`);
    console.log(` Role:     ${newAdmin.role}`);
    console.log(` Active:   ${newAdmin.isActive}`);
    console.log("==========================================");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB. Seed complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Admin Seeding Error:", error);
    process.exit(1);
  }
}

seedAdmin();
