"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PRODUCT_DEFAULTS, cols, deleteContent, escapeRegex, isDuplicateKey, newId, setContent, type Doc, type Product } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import type { FormState } from "./auth";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAX_UPLOAD_BYTES, UPLOAD_DIR, detectType, unsafeSvgReason, UPLOAD_TYPES } from "@/lib/uploads";
import { homeContentSchema } from "@/lib/home-content-schema";
import { ABOUT_KEY, CONTACT_KEY, HEADER_KEY, HOME_KEY } from "@/lib/home-content";
import { aboutContentSchema } from "@/lib/about-content-schema";
import { contactContentSchema } from "@/lib/contact-content-schema";
import { headerContentSchema } from "@/lib/header-content-schema";

const imageUrl = z.string().trim().regex(/^(\/[\w\-./]+|https:\/\/[\w\-./%?=&]+)$/, "Image must be a /path or https URL").max(500);

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, dashes").max(120),
  tagline: z.string().trim().min(2).max(200),
  description: z.string().trim().min(2).max(5000),
  price: z.coerce.number().min(0).max(100000),
  compare: z.union([z.literal(""), z.coerce.number().min(0).max(100000)]).optional(),
  image: imageUrl,
  gallery: z
    .string()
    .optional()
    .transform((s, ctx) => {
      if (!s) return [];
      try {
        return JSON.parse(s) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Gallery images are invalid" });
        return z.NEVER;
      }
    })
    .pipe(z.array(imageUrl).max(10, "Up to 10 gallery images")),
  badge: z.string().trim().max(30).optional(),
  format: z.string().trim().max(60).optional(), // no longer in the admin form; kept for older items
  categoryId: z.string().cuid(),
  features: z.string().max(2000).optional(),
  published: z.boolean(),
  featured: z.boolean(),
});

function parseProduct(form: FormData) {
  return productSchema.safeParse({
    ...Object.fromEntries(form),
    published: form.get("published") === "on",
    featured: form.get("featured") === "on",
  });
}

function toData(d: z.infer<typeof productSchema>) {
  return {
    name: d.name,
    slug: d.slug,
    tagline: d.tagline,
    description: d.description,
    priceCents: Math.round(d.price * 100),
    compareCents: d.compare === "" || d.compare === undefined ? null : Math.round(d.compare * 100),
    image: d.image,
    gallery: d.gallery,
    badge: d.badge || null,
    ...(d.format !== undefined && { format: d.format }),
    categoryId: d.categoryId,
    features: (d.features ?? "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 20),
    published: d.published,
    featured: d.featured,
  };
}

export async function saveProduct(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = form.get("id");
  const parsed = parseProduct(form);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (typeof id === "string" && id && parsed.data.published) {
    const current = await (await cols()).products.findOne({ _id: id }, { projection: { megaRemovedAt: 1 } });
    if (current?.megaRemovedAt) return { error: "This item was removed from the Mega Live Mall, so it can't be published." };
    if (parsed.data.price <= 0) return { error: "Set a price before publishing." };
  }
  const { products } = await cols();
  try {
    const now = new Date();
    if (typeof id === "string" && id) await products.updateOne({ _id: id }, { $set: { ...toData(parsed.data), updatedAt: now } });
    else await products.insertOne({ _id: newId(), ...PRODUCT_DEFAULTS, format: "", ...toData(parsed.data), createdAt: now, updatedAt: now });
  } catch (e) {
    if (isDuplicateKey(e)) return { error: "Could not save. Is the slug already used?" };
    throw e;
  }
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  const { orders, products, favorites } = await cols();
  const sold = await orders.countDocuments({ "items.productId": id }, { limit: 1 });
  // Products with orders are unpublished instead of deleted to keep order history intact.
  if (sold) await products.updateOne({ _id: id }, { $set: { published: false, updatedAt: new Date() } });
  else {
    await products.deleteOne({ _id: id });
    await favorites.deleteMany({ productId: id });
  }
  revalidatePath("/", "layout");
}

export async function setOrderStatus(form: FormData) {
  await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  const status = z.enum(["PENDING", "PAID", "REFUNDED", "CANCELLED"]).parse(form.get("status"));
  await (await cols()).orders.updateOne({ _id: id }, { $set: { status } });
  revalidatePath("/admin", "layout");
}

export async function setMessageRead(form: FormData) {
  await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  const read = form.get("read") === "true";
  await (await cols()).contactMessages.updateOne({ _id: id }, { $set: { read } });
  revalidatePath("/admin", "layout");
}

export async function deleteMessage(form: FormData) {
  await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  await (await cols()).contactMessages.deleteOne({ _id: id });
  revalidatePath("/admin", "layout");
}

export async function setUserRole(form: FormData) {
  const me = await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  const role = z.enum(["USER", "ADMIN"]).parse(form.get("role"));
  if (id === me.id) return; // can't demote yourself
  await (await cols()).users.updateOne({ _id: id }, { $set: { role, updatedAt: new Date() } });
  revalidatePath("/admin/customers");
}

export type UploadState = { url?: string; error?: string } | undefined;

/** Admin-only image upload for products (SVG, PNG, JPG, WebP up to 2 MB). */
export async function uploadProductImage(_: UploadState, form: FormData): Promise<UploadState> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image first." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Image must be 2 MB or smaller." };

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectType(buf);
  if (!ext) return { error: "Only SVG, PNG, JPG or WebP images are allowed." };
  if (ext === "svg") {
    const reason = unsafeSvgReason(buf.toString("utf8"));
    if (reason) return { error: `This SVG was blocked for safety: ${reason}.` };
  }

  const name = `${randomBytes(16).toString("hex")}.${ext}`;
  // On Vercel the disk is read-only, so uploads go to Vercel Blob when its token is set.
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const opts = { contentType: UPLOAD_TYPES[ext], addRandomSuffix: false } as const;
      try {
        return { url: (await put(`uploads/${name}`, buf, { ...opts, access: "public" })).url };
      } catch (e) {
        // A private Blob store refuses public files: store it privately and serve it through /uploads/[name].
        if (!/private/i.test(String((e as Error)?.message))) throw e;
        await put(`uploads/${name}`, buf, { ...opts, access: "private" });
        return { url: `/uploads/${name}` };
      }
    }
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), buf);
    return { url: `/uploads/${name}` };
  } catch (e) {
    console.error("Image upload failed:", e);
    const msg = String((e as Error)?.message ?? e).slice(0, 160);
    return { error: process.env.BLOB_READ_WRITE_TOKEN ? `Upload failed: ${msg}` : "Upload failed: connect Vercel Blob (BLOB_READ_WRITE_TOKEN) for uploads on the live site." };
  }
}

/** Move a product to draft (hidden from the store) or publish it again. */
export async function setProductPublished(form: FormData) {
  await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  const published = form.get("published") === "1";
  // A Mega item that left the Mega Mall cannot be sold until it comes back.
  const { products } = await cols();
  if (published && (await products.findOne({ _id: id }, { projection: { megaRemovedAt: 1 } }))?.megaRemovedAt) return;
  await products.updateOne({ _id: id }, { $set: { published, updatedAt: new Date() } });
  revalidatePath("/", "layout");
}

/** Copy a product as a new draft and open it for editing. */
export async function duplicateProduct(form: FormData) {
  await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  const { products } = await cols();
  const p = await products.findOne({ _id: id });
  if (!p) return;

  // Find a free slug: name-copy, name-copy-2, name-copy-3 ...
  const base = `${p.slug}-copy`.slice(0, 110);
  const taken = new Set((await products.find({ slug: { $regex: "^" + escapeRegex(base) } }, { projection: { slug: 1 } }).toArray()).map((x) => x.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;

  const copyId = newId();
  const now = new Date();
  const copy: Doc<Product> = {
      ...PRODUCT_DEFAULTS,
      _id: copyId,
      createdAt: now,
      updatedAt: now,
      slug,
      name: `${p.name} (copy)`.slice(0, 120),
      tagline: p.tagline,
      description: p.description,
      priceCents: p.priceCents,
      compareCents: p.compareCents,
      image: p.image,
      gallery: p.gallery,
      badge: p.badge,
      format: p.format,
      creator: p.creator,
      fileTypes: p.fileTypes,
      fileSize: p.fileSize,
      features: p.features,
      categoryId: p.categoryId,
      published: false, // copies start hidden until you're ready
      featured: false,
  };
  await products.insertOne(copy);
  revalidatePath("/admin/products");
  redirect(`/admin/products/${copyId}`);
}

export type ContentState = { ok?: boolean; error?: string } | undefined;

/** Save the editable home page content (admin → Home page). */
export async function saveHomeContent(_: ContentState, form: FormData): Promise<ContentState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("data") ?? ""));
  } catch {
    return { error: "Could not read the form. Please try again." };
  }
  const parsed = homeContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `${issue.path.join(" › ")}: ${issue.message}` };
  }
  await setContent(HOME_KEY, parsed.data);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Put the home page back to the built-in content. */
export async function resetHomeContent() {
  await requireAdmin();
  await deleteContent(HOME_KEY);
  revalidatePath("/", "layout");
}

/** Save the editable site header (admin → Header). */
export async function saveHeaderContent(_: ContentState, form: FormData): Promise<ContentState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("data") ?? ""));
  } catch {
    return { error: "Could not read the form. Please try again." };
  }
  const parsed = headerContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `${issue.path.join(" › ")}: ${issue.message}` };
  }
  await setContent(HEADER_KEY, parsed.data);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Put the header back to the built-in logo and menu. */
export async function resetHeaderContent() {
  await requireAdmin();
  await deleteContent(HEADER_KEY);
  revalidatePath("/", "layout");
}

// ---------- Categories ----------

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and single dashes"),
  icon: z.string().trim().max(40),
});

export type CategoryState = { ok?: boolean; error?: string } | undefined;

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

/** Create a category, or update it when an id is sent. */
export async function saveCategory(_: CategoryState, form: FormData): Promise<CategoryState> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "");
  const parsed = categorySchema.safeParse({ name, slug: String(form.get("slug") || "") || slugify(name), icon: form.get("icon") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { categories } = await cols();
  try {
    if (id) {
      await categories.updateOne({ _id: z.string().cuid().parse(id) }, { $set: parsed.data });
    } else {
      const last = await categories.find({}, { projection: { position: 1 } }).sort({ position: -1 }).limit(1).next();
      await categories.insertOne({ _id: newId(), ...parsed.data, position: (last?.position ?? 0) + 1 });
    }
  } catch (e) {
    if (isDuplicateKey(e)) return { error: "A category with this name or slug already exists." };
    throw e;
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Delete a category. Blocked while products still use it, so nothing disappears by accident. */
export async function deleteCategory(_: CategoryState, form: FormData): Promise<CategoryState> {
  await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  const { products, categories } = await cols();
  const used = await products.countDocuments({ categoryId: id });
  if (used) return { error: `This category still has ${used} product${used === 1 ? "" : "s"}. Move or delete them first.` };
  await categories.deleteOne({ _id: id });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Move a category one place up or down in the menu. */
export async function moveCategory(form: FormData) {
  await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  const dir = form.get("dir") === "up" ? -1 : 1;
  const { categories } = await cols();
  const list = await categories.find({}, { projection: { _id: 1 } }).sort({ position: 1, name: 1 }).toArray();
  const i = list.findIndex((c) => c._id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await categories.bulkWrite(list.map((c, k) => ({ updateOne: { filter: { _id: c._id }, update: { $set: { position: k + 1 } } } })));
  revalidatePath("/", "layout");
}

/** Save the editable About page (admin → About page). */
export async function saveAboutContent(_: ContentState, form: FormData): Promise<ContentState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("data") ?? ""));
  } catch {
    return { error: "Could not read the form. Please try again." };
  }
  const parsed = aboutContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `${issue.path.join(" › ")}: ${issue.message}` };
  }
  await setContent(ABOUT_KEY, parsed.data);
  revalidatePath("/about");
  return { ok: true };
}

/** Put the About page back to the built-in content. */
export async function resetAboutContent() {
  await requireAdmin();
  await deleteContent(ABOUT_KEY);
  revalidatePath("/about");
}

/** Save the editable Contact page (admin → Contact page). */
export async function saveContactContent(_: ContentState, form: FormData): Promise<ContentState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("data") ?? ""));
  } catch {
    return { error: "Could not read the form. Please try again." };
  }
  const parsed = contactContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `${issue.path.join(" › ")}: ${issue.message}` };
  }
  await setContent(CONTACT_KEY, parsed.data);
  revalidatePath("/contact");
  return { ok: true };
}

/** Put the Contact page back to the built-in content. */
export async function resetContactContent() {
  await requireAdmin();
  await deleteContent(CONTACT_KEY);
  revalidatePath("/contact");
}

export type SyncState = { ok?: string; error?: string } | undefined;

/** Pull Mall items from the Partner Store API into Products (admin → Products → Sync from Mall). */
export async function syncFromMall(_: SyncState): Promise<SyncState> {
  await requireAdmin();
  const { partnerConfigured, syncPartnerItems, PartnerError } = await import("@/lib/partner");
  if (!partnerConfigured()) return { error: "Partner key missing: add PARTNER_API_KEY to .env (local) or Vercel env vars, then restart." };
  try {
    const r = await syncPartnerItems();
    revalidatePath("/", "layout");
    return { ok: `Sync done: ${r.created} new, ${r.updated} updated, ${r.removed} hidden (left the Mall).` };
  } catch (e) {
    if (e instanceof PartnerError) {
      if (e.status === 401) return { error: "The partner key was rejected (missing, wrong or revoked)." };
      if (e.status === 429) return { error: "Too many requests to the Mall. Try again in a minute." };
      return { error: `Mall API error: ${e.code}` };
    }
    return { error: "Could not reach the Mall API. Check PARTNER_API_URL and try again." };
  }
}
