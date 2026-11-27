/**
 * Seed MongoDB with categories, demo products, an admin user and demo orders.
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

// Placeholder images until real item artwork is added from the admin dashboard.
const img = { nova: "/products/nova-ui-kit.png", social: "/products/social-launch-pack.png", book: "/products/freelance-playbook.png", studio: "/products/studio-proposal-system.png" };

const products = [
  ["neon-supercar", "Neon Supercar", "ride", 2900, 3900, img.nova, "Featured", "Animated", 4.9, 128, true],
  ["royal-chariot", "Royal Chariot", "ride", 1900, null, img.studio, null, "Animated", 4.7, 54, false],
  ["thunder-motorbike", "Thunder Motorbike", "ride", 2400, 2900, img.social, "New", "Animated", 4.8, 61, false],
  ["dragon-flight", "Dragon Flight", "ride", 3900, 4900, img.book, "Popular", "Animated", 4.9, 97, false],
  ["golden-yacht", "Golden Yacht", "ride", 3400, null, img.studio, null, "Animated", 4.7, 38, false],
  ["street-scooter", "Street Scooter", "ride", 900, null, img.nova, null, "Static", 4.5, 22, false],
  ["golden-crown-frame", "Golden Crown Frame", "frame", 1200, 1600, img.social, "Popular", "Animated", 4.8, 94, true],
  ["galaxy-ring-frame", "Galaxy Ring Frame", "frame", 900, null, img.nova, null, "Static", 4.6, 41, false],
  ["street-style-outfit", "Street Style Outfit", "dress-up", 1500, null, img.book, "New", "Animated", 4.8, 77, false],
  ["royal-gown", "Royal Gown", "dress-up", 2200, 2800, img.social, null, "Animated", 4.7, 36, false],
  ["sunset-profile-bg", "Sunset Profile BG", "profile-bg", 800, null, img.studio, null, "Static", 4.6, 63, false],
  ["aurora-profile-bg", "Aurora Profile BG", "profile-bg", 1100, null, img.nova, "Best seller", "Animated", 4.9, 212, true],
  ["velvet-throne-seat", "Velvet Throne Seat", "seats", 1400, null, img.book, null, "Static", 4.7, 48, false],
  ["diamond-vip-seat", "Diamond VIP Seat", "seats", 2400, 3000, img.social, "Popular", "Animated", 4.8, 89, false],
  ["dragon-entrance", "Dragon Entrance", "entrance", 3200, 4200, img.studio, "Featured", "Animated", 4.9, 156, true],
  ["fireworks-entrance", "Fireworks Entrance", "entrance", 2100, null, img.nova, null, "Animated", 4.7, 59, false],
  ["vip-gold-badge", "VIP Gold Badge", "badge", 700, null, img.social, null, "Static", 4.8, 118, false],
  ["top-host-badge", "Top Host Badge", "badge", 900, null, img.book, "New", "Animated", 4.6, 33, false],
  ["neon-chat-box", "Neon Chat Box", "chat-box", 600, null, img.nova, null, "Animated", 4.7, 71, false],
  ["love-bubble-chat-box", "Love Bubble Chat Box", "chat-box", 500, null, img.social, null, "Static", 4.5, 29, false],
  ["night-city-room-bg", "Night City Room BG", "room-bg", 1300, null, img.studio, null, "Animated", 4.8, 67, false],
  ["palace-hall-room-bg", "Palace Hall Room BG", "room-bg", 1700, 2200, img.book, "Popular", "Static", 4.7, 45, false],
  ["crystal-room-frame", "Crystal Room Frame", "room-frames", 1600, null, img.nova, null, "Animated", 4.8, 52, false],
  ["floral-room-frame", "Floral Room Frame", "room-frames", 1000, null, img.social, null, "Static", 4.6, 24, false],
  ["platinum-card", "Platinum Card", "card", 1800, 2400, img.studio, "New", "Animated", 4.9, 83, false],
  ["birthday-card", "Birthday Card", "card", 600, null, img.book, null, "Static", 4.7, 38, false],
] as const;

async function main() {
  const url = [process.env.MONGODB_URI, process.env.DATABASE_URL].find((u) => u?.startsWith("mongodb"));
  if (!url) throw new Error("Set MONGODB_URI (or DATABASE_URL) to your MongoDB connection string in .env");
  const client = await new MongoClient(url).connect();
  const db = client.db(process.env.MONGODB_DB || undefined);
  const C = {
    categories: db.collection<{ _id: string; name: string; slug: string; icon: string; position: number }>("categories"),
    products: db.collection<{ _id: string; slug: string; priceCents: number }>("products"),
    users: db.collection<{ _id: string; email: string }>("users"),
    orders: db.collection<{ _id: string }>("orders"),
    counters: db.collection<{ _id: string; value: number }>("counters"),
  };
  await C.categories.createIndex({ slug: 1 }, { unique: true });
  await C.products.createIndex({ slug: 1 }, { unique: true });
  await C.users.createIndex({ email: 1 }, { unique: true });

  try {
    for (const [i, c] of categories.entries()) {
      await C.categories.updateOne({ slug: c.slug }, { $setOnInsert: { _id: newId(), ...c, position: i + 1 } }, { upsert: true });
    }
    const cats = Object.fromEntries((await C.categories.find().toArray()).map((c) => [c.slug, c._id]));

    const now = new Date();
    for (const [slug, name, cat, price, compare, image, badge, format, rating, reviews, featured] of products) {
      await C.products.updateOne(
        { slug },
        {
          $setOnInsert: {
            _id: newId(),
            slug,
            name,
            tagline: `${format} ${categories.find((c) => c.slug === cat)?.name ?? "item"} that makes your profile and rooms stand out.`,
            description: `${name} is a premium ${format.toLowerCase()} item. Equip it from your inventory and show it off to everyone in your rooms.`,
            priceCents: price,
            compareCents: compare,
            image,
            gallery: [],
            badge,
            format,
            creator: "ET-Store Studio",
            fileTypes: format,
            fileSize: "Digital item",
            features: [format === "Animated" ? "Animated effect" : "HD artwork", "Instant delivery", "Visible to everyone", "Works in all rooms", "Equip anytime", "Free updates"],
            rating,
            reviewCount: reviews,
            published: true,
            featured,
            partnerId: null,
            partnerMotion: false,
            megaItemId: null,
            megaName: null,
            megaCategory: null,
            megaUpdatedAt: null,
            megaRemovedAt: null,
            categoryId: cats[cat],
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true },
      );
    }

    const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@lumamarket.test").toLowerCase();
    if (!(await C.users.findOne({ email: adminEmail }))) {
      const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString("base64url");
      await C.users.insertOne({ _id: newId(), email: adminEmail, name: "Sufian", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12), createdAt: now, updatedAt: now } as never);
      console.log(`Admin created: ${adminEmail}${process.env.ADMIN_PASSWORD ? " (password from ADMIN_PASSWORD)" : ` / ${password}  <- store this, it is not shown again`}`);
    }

    // Demo orders so the dashboard has data.
    if ((await C.orders.countDocuments()) === 0) {
      const all = await C.products.find().toArray();
      const names = [["Olivia", "Park"], ["Jordan", "Lee"], ["Sam", "Rivera"], ["Priya", "Shah"], ["Noah", "Williams"], ["Ava", "Chen"]];
      const docs = [];
      for (let i = 0; i < 60; i++) {
        const p = all[(i * 7) % all.length];
        const [first, last] = names[i % names.length];
        const tax = Math.round(p.priceCents * 0.08);
        docs.push({
          _id: newId(),
          number: 1001 + i,
          userId: null,
          email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
          firstName: first, lastName: last, country: "United States", address: "245 Mercer Street", city: "New York", state: "NY", zip: "10012",
          subtotal: p.priceCents, tax, total: p.priceCents + tax,
          status: i % 13 === 0 ? "REFUNDED" : i % 9 === 0 ? "PENDING" : "PAID",
          stripeSessionId: null,
          stripePaymentIntentId: null,
          paidAt: null,
          items: [{ id: newId(), productId: p._id, priceCents: p.priceCents, quantity: 1 }],
          createdAt: new Date(Date.now() - Math.floor(i * 1.4) * 864e5 - i * 3_600_000),
        });
      }
      await C.orders.insertMany(docs as never[]);
      // Order numbers continue after the demo orders.
      await C.counters.updateOne({ _id: "order" }, { $max: { value: 1000 + docs.length } }, { upsert: true });
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
