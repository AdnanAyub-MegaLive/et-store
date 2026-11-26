import "server-only";

/**
 * Client for the Mega Live portal Partner Store API (GET /api/partner/v1/items).
 * The partner key stays on the server. Media links from the portal are signed,
 * expire after ~15 minutes and only load for this site's origin, so the shop
 * serves them through /mega-media/<id>/<kind> instead of storing them.
 */

export type MegaItem = {
  id: string;
  name: string;
  category: { code: string; label: string } | null;
  updatedAt: string | null;
  media: { image: string; motion?: string };
};

const CATALOG_TTL_MS = 5 * 60 * 1000;
const state = globalThis as unknown as { megaCatalog?: { at: number; items: MegaItem[] }; megaLoading?: Promise<MegaItem[]> };

export function megaConfigured() {
  return Boolean(process.env.MEGA_API_URL && process.env.MEGA_PARTNER_KEY);
}

function siteOrigin() {
  try { return new URL(process.env.APP_URL ?? "").origin; } catch { return undefined; }
}

async function call(path: string): Promise<Response> {
  const base = (process.env.MEGA_API_URL ?? "").replace(/\/+$/, "");
  const origin = siteOrigin();
  return fetch(`${base}${path}`, {
    headers: { "x-partner-key": process.env.MEGA_PARTNER_KEY ?? "", accept: "application/json", ...(origin ? { origin } : {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
}

async function loadAll(): Promise<MegaItem[]> {
  if (!megaConfigured()) throw new Error("Mega catalog is not configured. Set MEGA_API_URL and MEGA_PARTNER_KEY.");
  const items: MegaItem[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 200; page++) {
    const res = await call(`/api/partner/v1/items?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    const body = (await res.json().catch(() => null)) as { success?: boolean; data?: { items: MegaItem[]; nextCursor: string | null }; error?: { message?: string } } | null;
    if (!res.ok || !body?.success || !body.data) throw new Error(body?.error?.message ?? `Mega catalog request failed (${res.status}).`);
    items.push(...body.data.items.map((i) => ({ ...i, category: i.category ?? null, updatedAt: i.updatedAt ?? null })));
    cursor = body.data.nextCursor;
    if (!cursor) break;
  }
  return items;
}

/** The whole Mega Mall catalog, cached for a few minutes. */
export async function megaCatalog({ fresh = false } = {}): Promise<MegaItem[]> {
  const cached = state.megaCatalog;
  if (!fresh && cached && Date.now() - cached.at < CATALOG_TTL_MS) return cached.items;
  state.megaLoading ??= loadAll()
    .then((items) => { state.megaCatalog = { at: Date.now(), items }; return items; })
    .finally(() => { state.megaLoading = undefined; });
  return state.megaLoading;
}

/** One item with fresh (unexpired) media links. */
export async function megaItem(id: string): Promise<MegaItem | null> {
  const find = (list: MegaItem[]) => list.find((i) => i.id === id) ?? null;
  const cached = state.megaCatalog;
  // Signed links last ~15 minutes; reuse the cached copy only while it is well inside that window.
  if (cached && Date.now() - cached.at < CATALOG_TTL_MS) return find(cached.items);
  return find(await megaCatalog({ fresh: true }));
}

/** Fetch the bytes behind a signed media link, as this site. */
export async function megaMedia(url: string): Promise<Response> {
  const origin = siteOrigin();
  return fetch(url, { headers: origin ? { origin, referer: `${origin}/` } : {}, cache: "no-store", signal: AbortSignal.timeout(20000) });
}

export const megaImagePath = (id: string, kind: "image" | "motion" = "image") => `/mega-media/${encodeURIComponent(id)}/${kind}`;
