"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import type { FormState } from "./auth";

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, dashes").max(120),
  tagline: z.string().trim().min(2).max(200),
  description: z.string().trim().min(2).max(5000),
  price: z.coerce.number().min(0).max(100000),
  compare: z.union([z.literal(""), z.coerce.number().min(0).max(100000)]).optional(),
  image: z.string().trim().regex(/^(\/[\w\-./]+|https:\/\/[\w\-./%?=&]+)$/, "Image must be a /path or https URL").max(500),
  badge: z.string().trim().max(30).optional(),
  format: z.string().trim().min(1).max(60),
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
    badge: d.badge || null,
    format: d.format,
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
  try {
    if (typeof id === "string" && id) await db.product.update({ where: { id }, data: toData(parsed.data) });
    else await db.product.create({ data: toData(parsed.data) });
  } catch {
    return { error: "Could not save. Is the slug already used?" };
  }
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  const sold = await db.orderItem.count({ where: { productId: id } });
  // Products with orders are unpublished instead of deleted to keep order history intact.
  if (sold) await db.product.update({ where: { id }, data: { published: false } });
  else await db.product.delete({ where: { id } });
  revalidatePath("/", "layout");
}

export async function setOrderStatus(form: FormData) {
  await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  const status = z.enum(["PENDING", "PAID", "REFUNDED", "CANCELLED"]).parse(form.get("status"));
  await db.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin", "layout");
}

export async function setMessageRead(form: FormData) {
  await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  const read = form.get("read") === "true";
  await db.contactMessage.update({ where: { id }, data: { read } });
  revalidatePath("/admin", "layout");
}

export async function deleteMessage(form: FormData) {
  await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  await db.contactMessage.delete({ where: { id } });
  revalidatePath("/admin", "layout");
}

export async function setUserRole(form: FormData) {
  const me = await requireAdmin();
  const id = z.string().cuid().parse(form.get("id"));
  const role = z.enum(["USER", "ADMIN"]).parse(form.get("role"));
  if (id === me.id) return; // can't demote yourself
  await db.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/customers");
}
