"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PRODUCT_DEFAULTS, cols, escapeRegex, newId } from "@/lib/db";
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
  const { categories } = await cols();
  const byName = (n: string) => ({ name: { $regex: "^" + escapeRegex(n) + "$", $options: "i" } });
  const names = [...(STORE_CATEGORY[code] ?? []), label];
  for (const n of names) {
    const hit = await categories.findOne({ $or: [byName(n), { slug: slugify(n) }] });
    if (hit) return hit._id;
  }
  const name = (STORE_CATEGORY[code]?.[0] ?? label).slice(0, 40) || "Mega Live";
  const found = await categories.findOne(byName(name));
  if (found) return found._id;
  const last = await categories.find({}, { projection: { position: 1 } }).sort({ position: -1 }).limit(1).next();
  const slug = slugify(name) || "mega-live";
  const created = await categories.findOneAndUpdate(
    { slug },
    { $setOnInsert: { _id: newId(), name, slug, icon: "frame", position: (last?.position ?? 0) + 1 } },
    { upsert: true, returnDocument: "after" },
  );
  return created!._id;
}

/** Create draft products for the selected Mega items (skips ones already added). */
export async function importMegaItems(form: FormData) {
  await requireAdmin();
  const wanted = ids(form);
  if (!wanted.length) return back("Select at least one item.", form);
  const catalog = await megaCatalog();
  const { products } = await cols();
  const existing = new Set((await products.find({ megaItemId: { $in: wanted } }, { projection: { megaItemId: 1 } }).toArray()).map((p) => p.megaItemId));
  let added = 0;
  for (const id of wanted) {
    const item = catalog.find((i) => i.id === id);
    if (!item || existing.has(id)) continue;
    const label = item.category?.label ?? "Mega Live";
    const now = new Date();
    await products.insertOne({
        ...PRODUCT_DEFAULTS,
        _id: newId(),
        createdAt: now,
        updatedAt: now,
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
  const col = (await cols()).products;
  const products = await col.find({ megaItemId: { $in: wanted } }, { projection: { priceCents: 1, megaRemovedAt: 1 } }).toArray();
  const ready = publish ? products.filter((p) => p.priceCents > 0 && !p.megaRemovedAt) : products;
  await col.updateMany({ _id: { $in: ready.map((p) => p._id) } }, { $set: { published: publish, updatedAt: new Date() } });
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
