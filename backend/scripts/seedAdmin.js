import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Teacher } from "../model/Teacher.js";
import { seedDefaultClassesAndSubjectsIfEmpty } from "../controllers/ClassController.js";

/**
 * Idempotent Administrator Seeding Script
 * Creates the initial administrator account from environment variables if not already present.
 * Never overwrites an existing administrator password or account settings.
 */
export async function seedAdminAccount(options = { closeConnection: false }) {
  const dbUri = process.env.DB_URI;
  if (!dbUri) {
    console.error("[SeedAdmin] Error: DB_URI is not defined in environment variables");
    return { success: false, message: "DB_URI is missing" };
  }

  // Read admin credentials from environment with secure defaults for local dev
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@institution.edu").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminSecurePass@2026!";
  const adminName = process.env.ADMIN_NAME || "System Administrator";
  const adminPhone = process.env.ADMIN_PHONE || "9876543210";
  const adminId = process.env.ADMIN_ID || "ADM-001";

  let shouldDisconnect = false;
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(dbUri);
      shouldDisconnect = options.closeConnection !== false;
    }

    console.log(`[SeedAdmin] Checking administrator existence for: ${adminEmail}`);

    // Check if account already exists
    const existing = await Teacher.findOne({ email: adminEmail });

    if (existing) {
      if (existing.role === "admin") {
        console.log(`[SeedAdmin] Administrator account "${adminEmail}" already exists. Preserving existing password and settings (idempotent).`);
        // Seed default classes/subjects as well
        await seedDefaultClassesAndSubjectsIfEmpty();
        return {
          success: true,
          created: false,
          message: "Administrator account already exists. Preserved existing credentials.",
          email: adminEmail,
        };
      } else {
        // Upgrade existing account to admin without resetting password
        existing.role = "admin";
        await existing.save();
        console.log(`[SeedAdmin] Existing account "${adminEmail}" upgraded to "admin" role. Existing password preserved.`);
        await seedDefaultClassesAndSubjectsIfEmpty();
        return {
          success: true,
          created: false,
          upgraded: true,
          message: "Account upgraded to administrator role.",
          email: adminEmail,
        };
      }
    }

    // Hash the password securely using bcrypt
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const newAdmin = new Teacher({
      name: adminName.trim(),
      email: adminEmail,
      pno: adminPhone.trim(),
      dob: "1985-01-01",
      password: hashedPassword,
      identityNumber: adminId,
      role: "admin",
      department: "Institutional Administration",
      sessions: [],
    });

    await newAdmin.save();
    console.log(`[SeedAdmin] Initial administrator account created successfully: ${adminEmail} (Role: admin)`);

    // Also seed default classes and subject mappings if empty
    await seedDefaultClassesAndSubjectsIfEmpty();

    return {
      success: true,
      created: true,
      message: "Initial administrator account created successfully.",
      email: adminEmail,
    };
  } catch (err) {
    console.error("[SeedAdmin] Failed to seed administrator account:", err);
    return { success: false, message: err.message };
  } finally {
    if (shouldDisconnect && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("[SeedAdmin] Database disconnected.");
    }
  }
}

// Execute directly if run as a script
if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("seedAdmin.js")) {
  seedAdminAccount({ closeConnection: true })
    .then((result) => {
      console.log("[SeedAdmin] Result:", result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error("[SeedAdmin] Unhandled fatal error:", err);
      process.exit(1);
    });
}
