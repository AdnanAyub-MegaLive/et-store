import "server-only";
import { db } from "@/lib/db";

/**
 * Partner Store API (Mall items). Server-to-server only: the key never reaches the browser.
 * Env: PARTNER_API_URL (Portal base URL), PARTNER_API_KEY.
 */

type PartnerItem = { id: string; name: string; media: { image: string; motion?: string } };
type ListData = {
  items: PartnerItem[];
  nextCursor: string | null;
  removed?: string[];
  removedCursor?: string | null;
  removedTruncated?: boolean;
  fullSyncRequired?: boolean;
};

export const UNASSIGNED_SLUG = "unassigned";
const SYNC_KEY = "partnerSync";

export function partnerConfigured() {
  return !!(process.env.PARTNER_API_URL && process.env.PARTNER_API_KEY);
}

class PartnerError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function call<T>(path: string, params: Record<string, string | undefined> = {}): Promise<T> {
  const base = process.env.PARTNER_API_URL?.replace(/\/+$/, "");
  const key = process.env.PARTNER_API_KEY;
  if (!base || !key) throw new PartnerError(500, "NOT_CONFIGURED", "PARTNER_API_URL / PARTNER_API_KEY are not set.");
  const url = new URL(base + path);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { "X-Partner-Key": key, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  const body = (await res.json().catch(() => null)) as { success?: boolean; data?: T; error?: { code: string; message: string } } | null;
  if (!res.ok || !body?.success) throw new PartnerError(res.status, body?.error?.code ?? "HTTP_" + res.status, body?.error?.message ?? res.statusText);
  return body.data as T;
}

/* ---------- Signed media links (expire in 10–15 min), kept in memory per server instance ---------- */

type Links = { image: string; motion?: string; at: number };
const links = new Map<string, Links>();
const LINK_TTL = 8 * 60_000;
let refreshing: Promise<void> | null = null;

function remember(items: PartnerItem[]) {
  const now = Date.now();
  for (const it of items) links.set(it.id, { image: it.media.image, motion: it.media.motion, at: now });
}

/** Re-sign links for the whole catalog in pages of 50 (one call instead of one per item). */
function refreshAllLinks() {
  refreshing ??= (async () => {
    let cursor: string | undefined;
    do {
      const d = await call<ListData>("/api/partner/v1/items", { limit: "50", cursor });
      remember(d.items);
      cursor = d.nextCursor ?? undefined;
    } while (cursor);
  })().finally(() => (refreshing = null));
  return refreshing;
}

async function freshLinks(id: string): Promise<Links | null> {
  const hit = links.get(id);
  if (hit && Date.now() - hit.at < LINK_TTL) return hit;
  try {
    if (links.size > 5) await refreshAllLinks();
    else {
      const it = await call<PartnerItem>(`/api/partner/v1/items/${encodeURIComponent(id)}`);
      remember([it]);
    }
  } catch (e) {
    if (e instanceof PartnerError && e.status === 404) return null;
    throw e;
  }
  return links.get(id) ?? null;
}

/** Fetch preview bytes from the Portal (fresh signed link). Returns null when there is no preview. */
export async function fetchPartnerMedia(id: string, kind: "image" | "motion"): Promise<Response | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const l = await freshLinks(id);
    const src = kind === "image" ? l?.image : l?.motion;
    if (!src) return null;
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const res = await fetch(src, { headers: { Referer: appUrl + "/", Origin: appUrl }, cache: "no-store", signal: AbortSignal.timeout(30000) });
    if (res.status === 403 && attempt === 0) {
      links.delete(id); // expired link: re-sign once
      continue;
    }
    return res;
  }
  return null;
}

/* ---------- Catalog sync ---------- */

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "item";
}

async function unassignedCategoryId() {
  const c = await db.category.upsert({
    where: { slug: UNASSIGNED_SLUG },
    create: { name: "Unassigned", slug: UNASSIGNED_SLUG, icon: "frame", position: 9999 },
    update: {},
  });
  return c.id;
}

async function upsertItem(it: PartnerItem, categoryId: string) {
  const image = `/partner-media/${encodeURIComponent(it.id)}/image`;
  const existing = await db.product.findUnique({ where: { partnerId: it.id }, select: { id: true } });
  if (existing) {
    // Only Mall-owned fields; price, category, text and publish state stay as set in admin.
    await db.product.update({ where: { id: existing.id }, data: { name: it.name, image, partnerMotion: !!it.media.motion } });
    return "updated" as const;
  }
  await db.product.create({
    data: {
      partnerId: it.id,
      partnerMotion: !!it.media.motion,
      slug: `${slugify(it.name)}-${slugify(it.id)}`,
      name: it.name,
      tagline: "",
      description: "",
      priceCents: 0,
      image,
      format: "Virtual item",
      creator: "MegaLive",
      fileTypes: "In-app",
      fileSize: "-",
      features: [],
      published: false, // hidden until a price and category are set
      categoryId,
    },
  });
  return "created" as const;
}

export type SyncResult = { created: number; updated: number; removed: number; full: boolean };

/** Pull new/changed Mall items into Products and hide items that left the Mall. */
export async function syncPartnerItems(): Promise<SyncResult> {
  const started = new Date();
  const last = await db.siteContent.findUnique({ where: { key: SYNC_KEY } });
  let since = (last?.data as { since?: string } | null)?.since;
  const categoryId = await unassignedCategoryId();
  const out: SyncResult = { created: 0, updated: 0, removed: 0, full: !since };
  const seen = new Set<string>();

  const hide = async (ids: string[]) => {
    if (!ids.length) return;
    const r = await db.product.updateMany({ where: { partnerId: { in: ids }, published: true }, data: { published: false } });
    out.removed += r.count;
  };

  // Items
  let cursor: string | undefined;
  let first: ListData | null = null;
  do {
    const d = await call<ListData>("/api/partner/v1/items", { limit: "50", cursor, updatedSince: since });
    if (d.fullSyncRequired) {
      since = undefined;
      out.full = true;
      cursor = undefined;
      continue;
    }
    first ??= d;
    remember(d.items);
    for (const it of d.items) {
      seen.add(it.id);
      out[await upsertItem(it, categoryId)]++;
    }
    cursor = d.nextCursor ?? undefined;
  } while (cursor);

  if (since && first) {
    // Removals (paged separately)
    await hide(first.removed ?? []);
    let rc = first.removedTruncated ? first.removedCursor ?? undefined : undefined;
    while (rc) {
      const d = await call<ListData>("/api/partner/v1/items", { limit: "1", updatedSince: since, removedCursor: rc });
      await hide(d.removed ?? []);
      rc = d.removedTruncated ? d.removedCursor ?? undefined : undefined;
    }
  } else {
    // Full sync: anything synced before but no longer in the Mall gets hidden.
    const stale = await db.product.findMany({ where: { partnerId: { not: null, notIn: [...seen] }, published: true }, select: { partnerId: true } });
    await hide(stale.map((s) => s.partnerId!));
  }

  const data = { since: started.toISOString(), at: new Date().toISOString(), ...out };
  await db.siteContent.upsert({ where: { key: SYNC_KEY }, create: { key: SYNC_KEY, data }, update: { data } });
  return out;
}

export async function lastPartnerSync() {
  const row = await db.siteContent.findUnique({ where: { key: SYNC_KEY } });
  return row?.data as (SyncResult & { at: string }) | undefined;
}

export { PartnerError };
