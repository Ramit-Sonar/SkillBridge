import { User } from "../models/user.model.js";

const createAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "SkillBridge Admin";

    if (!adminEmail || !adminPassword) {
      console.log("Admin credentials are missing in .env.");
      return;
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      const isAdminPasswordValid =
        await existingAdmin.isPasswordCorrect(adminPassword);

      if (existingAdmin.role !== "admin" || !isAdminPasswordValid) {
        existingAdmin.fullName = adminName;
        existingAdmin.email = adminEmail;
        existingAdmin.password = adminPassword;
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log("Admin account updated successfully.");
        return;
      }

      console.log("Admin already exists.");
      return;
    }

    // Create admin account
    await User.create({
      fullName: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      avatar: "",
    });

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error(" Error creating admin:", error.message);
  }
};

export default createAdmin;
