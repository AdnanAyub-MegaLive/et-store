/**
 * Seed MongoDB with the store categories and (if missing) an admin user. No demo data.
 * Only ADDS what is missing; never changes or deletes what was edited in admin.
 * Run: npm run db:seed  (reads DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD from .env)
 */
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const newId = () => "c" + randomBytes(12).toString("hex");

const categories = [
  { name: "Ride", slug: "ride", icon: "car" },
  { name: "Frame", slug: "frame", icon: "frame" },
  { name: "DressUp", slug: "dress-up", icon: "shirt" },
  { name: "Profile BG", slug: "profile-bg", icon: "image" },
  { name: "Seats", slug: "seats", icon: "armchair" },
  { name: "Entrance", slug: "entrance", icon: "door-open" },
  { name: "Badge", slug: "badge", icon: "award" },
  { name: "Chat Box", slug: "chat-box", icon: "message-square" },
  { name: "Room BG", slug: "room-bg", icon: "home" },
  { name: "Room Frames", slug: "room-frames", icon: "panels" },
  { name: "Card", slug: "card", icon: "credit-card" },
];

async function main() {
  const url = [process.env.MONGODB_URI, process.env.DATABASE_URL].find((u) => u?.startsWith("mongodb"));
  if (!url) throw new Error("Set MONGODB_URI (or DATABASE_URL) to your MongoDB connection string in .env");
  const client = await new MongoClient(url).connect();
  const db = client.db(process.env.MONGODB_DB || undefined);
  const C = {
    categories: db.collection<{ _id: string; name: string; slug: string; icon: string; position: number }>("categories"),
    users: db.collection<{ _id: string; email: string }>("users"),
  };
  await C.categories.createIndex({ slug: 1 }, { unique: true });
  await C.users.createIndex({ email: 1 }, { unique: true });

  try {
    for (const [i, c] of categories.entries()) {
      await C.categories.updateOne({ slug: c.slug }, { $setOnInsert: { _id: newId(), ...c, position: i + 1 } }, { upsert: true });
    }
    const now = new Date();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (adminEmail && !(await C.users.findOne({ email: adminEmail }))) {
      const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString("base64url");
      await C.users.insertOne({ _id: newId(), email: adminEmail, name: "Sufian", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12), createdAt: now, updatedAt: now } as never);
      console.log(`Admin created: ${adminEmail}${process.env.ADMIN_PASSWORD ? " (password from ADMIN_PASSWORD)" : ` / ${password}  <- store this, it is not shown again`}`);
    }

    console.log("Seed done.");
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
