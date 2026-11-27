/**
 * Create or update the admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
 * Unlike db:seed, this ALWAYS sets the password and the ADMIN role, so it also
 * fixes an admin whose password no longer matches the env.
 * Run: npm run db:seed-admin  (reads MONGODB_URI or DATABASE_URL from .env)
 */
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

async function main() {
  const url = [process.env.MONGODB_URI, process.env.DATABASE_URL].find((u) => u?.startsWith("mongodb"));
  if (!url) throw new Error("Set MONGODB_URI (or DATABASE_URL) to your MongoDB connection string in .env");

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Set ADMIN_EMAIL to a valid email in .env");
  if (!password || password.length < 8) throw new Error("Set ADMIN_PASSWORD (8+ characters) in .env");

  const client = await new MongoClient(url).connect();
  try {
    const users = client.db(process.env.MONGODB_DB || undefined).collection<{ _id: string; email: string }>("users");
    await users.createIndex({ email: 1 }, { unique: true });
    const now = new Date();
    const r = await users.updateOne(
      { email },
      {
        $set: { role: "ADMIN", passwordHash: await bcrypt.hash(password, 12), updatedAt: now },
        $setOnInsert: { _id: "c" + randomBytes(12).toString("hex"), email, name: process.env.ADMIN_NAME || "Admin", createdAt: now },
      },
      { upsert: true },
    );
    console.log(r.upsertedCount ? `Admin created: ${email}` : `Admin updated (password and role reset): ${email}`);
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
