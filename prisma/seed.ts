import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const db = new PrismaClient();

const categories = [
  { name: "Templates", slug: "templates", icon: "layout-template" },
  { name: "UI Kits", slug: "ui-kits", icon: "shapes" },
  { name: "eBooks & Guides", slug: "ebooks-guides", icon: "book-open" },
  { name: "Graphics", slug: "graphics", icon: "palette" },
  { name: "AI Prompts", slug: "ai-prompts", icon: "sparkles" },
  { name: "Business Tools", slug: "business-tools", icon: "briefcase" },
];

const img = { nova: "/products/nova-ui-kit.png", social: "/products/social-launch-pack.png", book: "/products/freelance-playbook.png", studio: "/products/studio-proposal-system.png" };

const products = [
  ["nova-ui-kit", "Nova UI Kit", "ui-kits", 4800, 6400, img.nova, "Featured", "Figma", 4.9, 128, true],
  ["social-launch-pack", "Social Launch Pack", "graphics", 1900, 2900, img.social, "Popular", "Canva", 4.8, 94, true],
  ["freelance-playbook", "The Freelance Playbook", "ebooks-guides", 2400, null, img.book, "Best seller", "PDF", 4.9, 212, true],
  ["studio-proposal-system", "Studio Proposal System", "business-tools", 3200, null, img.studio, "New", "PDF + Notion", 4.7, 67, true],
  ["creator-dashboard", "Creator Dashboard", "templates", 2900, 3900, img.nova, null, "Notion", 4.8, 83, false],
  ["brand-voice-prompt-pack", "Brand Voice Prompt Pack", "ai-prompts", 1500, null, img.book, "New", "PDF", 4.9, 156, false],
  ["editorial-canva-suite", "Editorial Canva Suite", "templates", 3600, null, img.social, "Featured", "Canva", 4.8, 71, false],
  ["client-onboarding-os", "Client Onboarding OS", "business-tools", 4200, 5200, img.studio, null, "Notion", 4.9, 118, false],
  ["minimal-portfolio-template", "Minimal Portfolio Template", "templates", 2800, null, img.social, "Popular", "Figma", 4.7, 59, false],
  ["pitch-deck-kit", "Pitch Deck Kit", "templates", 3900, null, img.studio, null, "Figma", 4.6, 41, false],
  ["icon-essentials", "Icon Essentials", "graphics", 1200, null, img.nova, null, "Figma", 4.8, 77, false],
  ["seo-prompt-library", "SEO Prompt Library", "ai-prompts", 1900, null, img.book, null, "PDF", 4.5, 33, false],
] as const;

async function main() {
  for (const c of categories) await db.category.upsert({ where: { slug: c.slug }, create: c, update: c });
  const cats = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));

  for (const [slug, name, cat, price, compare, image, badge, format, rating, reviews, featured] of products) {
    const data = {
      name,
      tagline: `A complete ${format} resource for creators building polished work without starting from scratch.`,
      description: `${name} gives your team a flexible foundation for creating consistent, polished results across every project and workflow.`,
      priceCents: price,
      compareCents: compare,
      image,
      badge,
      format,
      rating,
      reviewCount: reviews,
      featured,
      creator: "Northstar Studio",
      fileTypes: format.includes("Figma") ? "Figma, Sketch" : format,
      fileSize: "128 MB",
      features: ["180+ components", "24 page templates", "Auto-layout", "Dark + light modes", "Responsive grids", "Free updates"],
      categoryId: cats[cat],
    };
    await db.product.upsert({ where: { slug }, create: { slug, ...data }, update: data });
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@lumamarket.test").toLowerCase();
  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString("base64url");
    await db.user.create({ data: { email: adminEmail, name: "Maya Chen", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) } });
    console.log(`Admin created: ${adminEmail}${process.env.ADMIN_PASSWORD ? " (password from ADMIN_PASSWORD)" : ` / ${password}  <- store this, it is not shown again`}`);
  }

  // Demo orders so the dashboard has data.
  if ((await db.order.count()) === 0) {
    const all = await db.product.findMany();
    const names = [["Olivia", "Park"], ["Jordan", "Lee"], ["Sam", "Rivera"], ["Priya", "Shah"], ["Noah", "Williams"], ["Ava", "Chen"]];
    for (let i = 0; i < 60; i++) {
      const p = all[(i * 7) % all.length];
      const [first, last] = names[i % names.length];
      const tax = Math.round(p.priceCents * 0.08);
      await db.order.create({
        data: {
          email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
          firstName: first, lastName: last, country: "United States", address: "245 Mercer Street", city: "New York", state: "NY", zip: "10012",
          subtotal: p.priceCents, tax, total: p.priceCents + tax,
          status: i % 13 === 0 ? "REFUNDED" : i % 9 === 0 ? "PENDING" : "PAID",
          createdAt: new Date(Date.now() - Math.floor(i * 1.4) * 864e5 - i * 3_600_000),
          items: { create: { productId: p.id, priceCents: p.priceCents, quantity: 1 } },
        },
      });
    }
  }
}

main().finally(() => db.$disconnect());
