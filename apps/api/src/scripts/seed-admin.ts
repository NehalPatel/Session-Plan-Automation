import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/db.js";
import { config } from "../config/env.js";
import { User } from "../models/User.js";

async function seedAdmin() {
  const name = process.env.ADMIN_NAME?.trim() || "Admin";
  const email = (process.env.ADMIN_EMAIL?.trim() || "").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }

  await connectDatabase(config.mongoUri);

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    await existing.save();
    console.log(`Updated existing user to admin: ${email}`);
  } else {
    await User.create({ email, name, passwordHash, role: "admin" });
    console.log(`Created admin user: ${email}`);
  }

  await (await import("mongoose")).default.disconnect();
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin", error);
  process.exit(1);
});
