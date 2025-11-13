require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("./models/user.model");

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: "admin@disasteraid.com",
    });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log("Email:", existingAdmin.email);
      console.log("Role:", existingAdmin.role);
      console.log("Suspended:", existingAdmin.suspended);

      // Ask if we should update the password
      console.log(
        "\nIf you want to reset the password, delete the existing admin user first."
      );
      process.exit(0);
    }

    // Hash password
    const password = "Admin123!";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = new User({
      name: "Admin User",
      email: "admin@disasteraid.com",
      passwordHash: hashedPassword,
      role: "admin",
      suspended: false,
    });

    await admin.save();

    console.log("\n✅ Admin user created successfully!\n");
    console.log("═══════════════════════════════════════");
    console.log("  Login Credentials");
    console.log("═══════════════════════════════════════");
    console.log("  Email:    admin@disasteraid.com");
    console.log("  Password: Admin123!");
    console.log("═══════════════════════════════════════");
    console.log(
      "\n⚠️  IMPORTANT: Please change this password after first login!\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
