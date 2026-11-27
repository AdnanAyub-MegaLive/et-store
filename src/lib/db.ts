import "server-only";
import { MongoClient, type Binary, type Collection, type Db } from "mongodb";
import { randomBytes } from "node:crypto";

/**
 * MongoDB data layer (official driver). Every document uses a string `_id`;
 * `fromDoc` turns it into the `id` field the app works with.
 */

export type Role = "USER" | "ADMIN";
export type OrderStatus = "PENDING" | "PAID" | "REFUNDED" | "CANCELLED";

export type User = { id: string; email: string; name: string; passwordHash: string; role: Role; createdAt: Date; updatedAt: Date };
export type PasswordResetToken = { id: string; tokenHash: string; userId: string; expiresAt: Date; usedAt: Date | null; createdAt: Date };
export type Category = { id: string; name: string; slug: string; icon: string; position: number };
export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  compareCents: number | null;
  image: string;
  /** Optional product video (uploaded /uploads/… file or https link), shown on the product page. */
  video: string | null;
  gallery: string[];
  badge: string | null;
  format: string;
  creator: string;
  fileTypes: string;
  fileSize: string;
  features: string[];
  rating: number;
  reviewCount: number;
  published: boolean;
  featured: boolean;
  /** Mall item id (Sync from Mall). */
  partnerId: string | null;
  partnerMotion: boolean;
  /** Mega Live Mall item this product was imported from. */
  megaItemId: string | null;
  megaName: string | null;
  megaCategory: string | null;
  megaUpdatedAt: Date | null;
  megaRemovedAt: Date | null;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
};
export type OrderItem = { id: string; productId: string; priceCents: number; quantity: number };
export type Order = {
  id: string;
  number: number;
  userId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: Date | null;
  /** Order lines are embedded in the order document. */
  items: OrderItem[];
  createdAt: Date;
};
export type Favorite = { id: string; userId: string; productId: string; createdAt: Date };
export type ContactMessage = { id: string; name: string; email: string; topic: string; message: string; read: boolean; createdAt: Date };
export type NewsletterSubscriber = { id: string; email: string; createdAt: Date };
export type SiteContent = { id: string; data: unknown; updatedAt: Date };
export type Counter = { id: string; value: number };

/** Stored shape: `id` is kept as `_id`. */
export type Doc<T extends { id: string }> = Omit<T, "id"> & { _id: string };

export const PRODUCT_DEFAULTS = {
  compareCents: null,
  video: null,
  gallery: [] as string[],
  badge: null,
  creator: "ET-Store",
  fileTypes: "In-app",
  fileSize: "-",
  features: [] as string[],
  rating: 5,
  reviewCount: 0,
  published: true,
  featured: false,
  partnerId: null,
  partnerMotion: false,
  megaItemId: null,
  megaName: null,
  megaCategory: null,
  megaUpdatedAt: null,
  megaRemovedAt: null,
} satisfies Partial<Product>;

/** New unique id ("c" + 24 hex chars). */
export const newId = () => "c" + randomBytes(12).toString("hex");
export const isId = (v: unknown): v is string => typeof v === "string" && /^c[0-9a-z]{8,40}$/i.test(v);

export function fromDoc<T extends { id: string }>(d: Doc<T>): T;
export function fromDoc<T extends { id: string }>(d: Doc<T> | null): T | null;
export function fromDoc<T extends { id: string }>(d: Doc<T> | null): T | null {
  if (!d) return null;
  const { _id, ...rest } = d;
  return { id: _id, ...rest } as unknown as T;
}
export const fromDocs = <T extends { id: string }>(ds: Doc<T>[]): T[] => ds.map((d) => fromDoc(d));

/* ---------- Connection (one client per server process) ---------- */

const g = globalThis as unknown as { _mongo?: Promise<MongoClient>; _mongoIndexes?: Promise<void> };

/** MONGODB_URI wins; DATABASE_URL is used only if it is a MongoDB string (a Postgres integration may also set it). */
export function mongoUrl(): string | undefined {
  return [process.env.MONGODB_URI, process.env.DATABASE_URL].find((u) => u?.startsWith("mongodb"));
}

function client(): Promise<MongoClient> {
  const url = mongoUrl();
  if (!url) throw new Error("Set MONGODB_URI (or DATABASE_URL) to a mongodb:// or mongodb+srv:// connection string.");
  g._mongo ??= new MongoClient(url, { maxPoolSize: 10 }).connect().catch((e) => {
    g._mongo = undefined;
    throw e;
  });
  return g._mongo;
}

async function database(): Promise<Db> {
  const db = (await client()).db(process.env.MONGODB_DB || undefined);
  g._mongoIndexes ??= ensureIndexes(db).catch((e) => {
    g._mongoIndexes = undefined;
    throw e;
  });
  await g._mongoIndexes;
  return db;
}

export type Collections = {
  users: Collection<Doc<User>>;
  resetTokens: Collection<Doc<PasswordResetToken>>;
  categories: Collection<Doc<Category>>;
  products: Collection<Doc<Product>>;
  orders: Collection<Doc<Order>>;
  favorites: Collection<Doc<Favorite>>;
  contactMessages: Collection<Doc<ContactMessage>>;
  newsletter: Collection<Doc<NewsletterSubscriber>>;
  siteContent: Collection<Doc<SiteContent>>;
  counters: Collection<Doc<Counter>>;
  /** Uploaded images (used when no Vercel Blob store is connected). _id is the file name. */
  uploads: Collection<{ _id: string; data: Binary; contentType: string; size: number; createdAt: Date }>;
};

function collectionsOf(d: Db): Collections {
  return {
    users: d.collection("users"),
    resetTokens: d.collection("passwordResetTokens"),
    categories: d.collection("categories"),
    products: d.collection("products"),
    orders: d.collection("orders"),
    favorites: d.collection("favorites"),
    contactMessages: d.collection("contactMessages"),
    newsletter: d.collection("newsletterSubscribers"),
    siteContent: d.collection("siteContent"),
    counters: d.collection("counters"),
    uploads: d.collection("uploads"),
  };
}

/** All collections, connected and indexed. */
export async function cols(): Promise<Collections> {
  return collectionsOf(await database());
}

/** Unique and lookup indexes (created once per process; safe to repeat). */
async function ensureIndexes(d: Db) {
  const c = collectionsOf(d);
  const sparseUnique = { unique: true, partialFilterExpression: {} as Record<string, unknown> };
  await Promise.all([
    c.users.createIndex({ email: 1 }, { unique: true }),
    c.users.createIndex({ createdAt: -1 }),
    c.resetTokens.createIndex({ tokenHash: 1 }, { unique: true }),
    c.resetTokens.createIndex({ userId: 1 }),
    c.categories.createIndex({ name: 1 }, { unique: true }),
    c.categories.createIndex({ slug: 1 }, { unique: true }),
    c.categories.createIndex({ position: 1, name: 1 }),
    c.products.createIndex({ slug: 1 }, { unique: true }),
    c.products.createIndex({ partnerId: 1 }, { ...sparseUnique, partialFilterExpression: { partnerId: { $type: "string" } } }),
    c.products.createIndex({ megaItemId: 1 }, { ...sparseUnique, partialFilterExpression: { megaItemId: { $type: "string" } } }),
    c.products.createIndex({ categoryId: 1 }),
    c.products.createIndex({ published: 1, featured: 1 }),
    c.orders.createIndex({ number: 1 }, { unique: true }),
    c.orders.createIndex({ stripeSessionId: 1 }, { unique: true, partialFilterExpression: { stripeSessionId: { $type: "string" } } }),
    c.orders.createIndex({ stripePaymentIntentId: 1 }, { unique: true, partialFilterExpression: { stripePaymentIntentId: { $type: "string" } } }),
    c.orders.createIndex({ userId: 1 }),
    c.orders.createIndex({ status: 1, createdAt: -1 }),
    c.orders.createIndex({ "items.id": 1 }),
    c.orders.createIndex({ "items.productId": 1 }),
    c.favorites.createIndex({ userId: 1, productId: 1 }, { unique: true }),
    c.favorites.createIndex({ productId: 1 }),
    c.contactMessages.createIndex({ read: 1, createdAt: -1 }),
    c.newsletter.createIndex({ email: 1 }, { unique: true }),
  ]);
}

/** True for a MongoDB duplicate-key error (unique index). */
export const isDuplicateKey = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: number }).code === 11000;

/** Escape user text for use inside a RegExp. */
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Next order number (atomic counter; starts at 1001). */
export async function nextOrderNumber(): Promise<number> {
  const { counters } = await cols();
  const r = await counters.findOneAndUpdate({ _id: "order" }, { $inc: { value: 1 } }, { upsert: true, returnDocument: "after" });
  const v = r?.value ?? 1;
  return v < 1001 ? 1000 + v : v;
}

/** Products (as docs) → models with their category attached. */
export async function withCategories<T extends { _id: string; categoryId: string }>(docs: T[]): Promise<(Omit<T, "_id"> & { id: string; category: Category })[]> {
  const { categories } = await cols();
  const ids = [...new Set(docs.map((d) => d.categoryId))];
  const map = new Map((await categories.find({ _id: { $in: ids } }).toArray()).map((c) => [c._id, fromDoc<Category>(c)]));
  return docs.map(({ _id, ...rest }) => ({ ...rest, id: _id, category: map.get(rest.categoryId) ?? { id: rest.categoryId, name: "", slug: "", icon: "frame", position: 0 } }));
}

/** Orders (as docs) → models whose items carry their product's name and category name. */
export type OrderItemWithProduct = OrderItem & { product: { name: string; slug: string; category: { name: string } } };
export async function withOrderProducts<T extends { _id: string; items: OrderItem[] }>(docs: T[]): Promise<(Omit<T, "_id" | "items"> & { id: string; items: OrderItemWithProduct[] })[]> {
  const { products } = await cols();
  const ids = [...new Set(docs.flatMap((o) => o.items.map((i) => i.productId)))];
  const list = await withCategories(await products.find({ _id: { $in: ids } }, { projection: { name: 1, slug: 1, categoryId: 1 } }).toArray());
  const map = new Map(list.map((p) => [p.id, { name: p.name, slug: p.slug, category: { name: p.category.name } }]));
  return docs.map(({ _id, ...o }) => ({
    ...(o as unknown as Omit<T, "_id" | "items">),
    id: _id,
    items: o.items.map((i) => ({ ...i, product: map.get(i.productId) ?? { name: "Deleted product", slug: "", category: { name: "Other" } } })),
  }));
}

/** Categories in menu order, each with its number of products (optionally only published ones). */
export async function categoriesWithCounts(opts: { publishedOnly?: boolean; hideSlug?: string } = {}) {
  const { categories, products } = await cols();
  const [list, counts] = await Promise.all([
    categories.find(opts.hideSlug ? { slug: { $ne: opts.hideSlug } } : {}).sort({ position: 1, name: 1 }).toArray(),
    products.aggregate<{ _id: string; n: number }>([{ $match: opts.publishedOnly ? { published: true } : {} }, { $group: { _id: "$categoryId", n: { $sum: 1 } } }]).toArray(),
  ]);
  const n = new Map(counts.map((c) => [c._id, c.n]));
  return list.map((c) => ({ ...fromDoc<Category>(c), _count: { products: n.get(c._id) ?? 0 } }));
}

/* ---------- Site content (JSON blobs keyed by name) ---------- */

export async function getContent(key: string): Promise<unknown> {
  const { siteContent } = await cols();
  return (await siteContent.findOne({ _id: key }))?.data;
}
export async function setContent(key: string, data: unknown) {
  const { siteContent } = await cols();
  await siteContent.updateOne({ _id: key }, { $set: { data, updatedAt: new Date() } }, { upsert: true });
}
export async function deleteContent(key: string) {
  const { siteContent } = await cols();
  await siteContent.deleteOne({ _id: key });
}
