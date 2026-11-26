"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { megaCatalog, megaImagePath } from "@/lib/mega";
import { syncMegaProducts } from "@/lib/mega-sync";

const ids = (form: FormData) => z.array(z.string().regex(/^[A-Za-z0-9_-]{1,64}$/)).max(200).parse(form.getAll("id").map(String));
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
const back = (msg: string, form: FormData) => {
  const q = new URLSearchParams();
  for (const k of ["cat", "status", "q"]) { const v = form.get(k); if (typeof v === "string" && v) q.set(k, v); }
  q.set("msg", msg);
  redirect(`/admin/mega?${q}`);
};

/** Mega upload category -> this store's category names (the store's own naming wins). */
const STORE_CATEGORY: Record<string, string[]> = {
  RIDES: ["Ride", "Rides"], FRAMES: ["Frame", "Frames"], PROFILE_DRESS: ["DressUp", "Dress Up", "Profile Dresses"],
  PROFILE_BG: ["Profile BG"], SEAT_STYLES: ["Seats", "Seat Styles"], ENTRANCES: ["Entrance", "Entrance Strip"],
  BADGES: ["Badge", "Badges"], CHAT_BOXES: ["Chat Box", "Chat Bubble", "Chat Boxes"], ROOM_FRAMES: ["Room Frames", "Room Frame"],
  ROOM_BACKGROUNDS: ["Room BG", "Room Backgrounds"], BUSINESS_CARD: ["Card", "Business Cards"], USER_TAGS: ["User Tags"],
};

async function categoryFor(code: string, label: string) {
  const names = [...(STORE_CATEGORY[code] ?? []), label];
  for (const n of names) {
    const hit = await db.category.findFirst({ where: { OR: [{ name: { equals: n, mode: "insensitive" } }, { slug: slugify(n) }] } });
    if (hit) return hit.id;
  }
  const name = (STORE_CATEGORY[code]?.[0] ?? label).slice(0, 40) || "Mega Live";
  const found = await db.category.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  if (found) return found.id;
  const last = await db.category.aggregate({ _max: { position: true } });
  const slug = slugify(name) || "mega-live";
  const created = await db.category.upsert({ where: { slug }, update: {}, create: { name, slug, icon: "frame", position: (last._max.position ?? 0) + 1 } });
  return created.id;
}

/** Create draft products for the selected Mega items (skips ones already added). */
export async function importMegaItems(form: FormData) {
  await requireAdmin();
  const wanted = ids(form);
  if (!wanted.length) return back("Select at least one item.", form);
  const catalog = await megaCatalog();
  const existing = new Set((await db.product.findMany({ where: { megaItemId: { in: wanted } }, select: { megaItemId: true } })).map((p) => p.megaItemId));
  let added = 0;
  for (const id of wanted) {
    const item = catalog.find((i) => i.id === id);
    if (!item || existing.has(id)) continue;
    const label = item.category?.label ?? "Mega Live";
    await db.product.create({
      data: {
        slug: `${slugify(item.name) || "item"}-${id.toLowerCase()}`.slice(0, 120),
        name: item.name,
        tagline: `${label} for your Mega Live profile`,
        description: `${item.name} is a ${label.toLowerCase()} item from the Mega Live Mall.`,
        priceCents: 0,
        image: megaImagePath(id),
        format: label,
        features: [],
        published: false,
        categoryId: await categoryFor(item.category?.code ?? "", label),
        megaItemId: id,
        megaName: item.name,
        megaCategory: label,
        megaUpdatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
      },
    });
    added++;
  }
  revalidatePath("/admin/products");
  back(added ? `Added ${added} item${added === 1 ? "" : "s"} as drafts. Set a price and category, then publish.` : "Those items are already in the store.", form);
}

/** Publish the products linked to the selected Mega items (priced, still in the Mall). */
export async function publishMegaItems(form: FormData) { return setMegaPublished(form, true); }
/** Hide the products linked to the selected Mega items from the website. */
export async function unpublishMegaItems(form: FormData) { return setMegaPublished(form, false); }

async function setMegaPublished(form: FormData, publish: boolean) {
  await requireAdmin();
  const wanted = ids(form);
  if (!wanted.length) return back("Select at least one item.", form);
  const products = await db.product.findMany({ where: { megaItemId: { in: wanted } }, select: { id: true, priceCents: true, megaRemovedAt: true } });
  const ready = publish ? products.filter((p) => p.priceCents > 0 && !p.megaRemovedAt) : products;
  await db.product.updateMany({ where: { id: { in: ready.map((p) => p.id) } }, data: { published: publish } });
  revalidatePath("/", "layout");
  const skipped = products.length - ready.length;
  const missing = wanted.length - products.length;
  const parts = [`${publish ? "Published" : "Unpublished"} ${ready.length} item${ready.length === 1 ? "" : "s"}.`];
  if (skipped) parts.push(`${skipped} skipped: set a price first, or the item was removed in Mega.`);
  if (missing) parts.push(`${missing} not added to the store yet.`);
  back(parts.join(" "), form);
}

/** Refresh the catalog from the portal and apply removals and renames now. */
export async function syncMegaNow(form: FormData) {
  await requireAdmin();
  const r = await syncMegaProducts(await megaCatalog({ fresh: true }));
  revalidatePath("/", "layout");
  back(`Synced with Mega: ${r.removed} removed, ${r.restored} back in the Mall, ${r.renamed} renamed.`, form);
}
