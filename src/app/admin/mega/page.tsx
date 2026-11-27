import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw, Search, X } from "lucide-react";
import { cols, withCategories } from "@/lib/db";
import { money } from "@/lib/format";
import { megaCatalog, megaConfigured, megaImagePath, type MegaItem } from "@/lib/mega";
import { syncMegaProducts } from "@/lib/mega-sync";
import { importMegaItems, publishMegaItems, syncMegaNow, unpublishMegaItems } from "@/lib/actions/mega";
import { SelectAll } from "./select-all";

export const metadata: Metadata = { title: "Mega catalog" };

type Status = "new" | "draft" | "published" | "removed";
const statusLabel: Record<Status, string> = { new: "Not added", draft: "Draft", published: "Published", removed: "Removed in Mega" };
const statusStyle: Record<Status, string> = {
  new: "bg-surface text-muted",
  draft: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  published: "bg-brand-soft text-brand",
  removed: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
};
const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v ?? "").slice(0, 100);

export default async function MegaCatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cat = pick(sp.cat), status = pick(sp.status) as Status | "", q = pick(sp.q).trim(), msg = pick(sp.msg);

  if (!megaConfigured()) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Mega catalog</h1>
        <p className="rounded-xl border border-line bg-panel p-5 text-sm text-muted">
          Connect the Mega Live portal first: set <code>MEGA_API_URL</code> (for example https://portal.megachat.live) and <code>MEGA_PARTNER_KEY</code> (create it in the portal under Uploads → Partner keys, allowed for this website&apos;s address).
        </p>
      </div>
    );
  }

  let items: MegaItem[] = [];
  let error = "";
  try {
    items = await megaCatalog();
    await syncMegaProducts(items);
  } catch (e) {
    error = (e as Error).message;
  }
  const products = await withCategories(
    await (await cols()).products
      .find({ megaItemId: { $type: "string" } }, { projection: { megaItemId: 1, name: 1, priceCents: 1, published: 1, megaRemovedAt: 1, megaName: 1, megaCategory: 1, categoryId: 1 } })
      .toArray(),
  );
  const byMega = new Map(products.map((p) => [p.megaItemId!, p]));
  const statusOf = (id: string): Status => {
    const p = byMega.get(id);
    return !p ? "new" : p.megaRemovedAt ? "removed" : p.published ? "published" : "draft";
  };
  // Items removed from the Mall still show here (from the store's own records) so the admin can see what happened.
  const removedRows: MegaItem[] = products
    .filter((p) => p.megaRemovedAt && !items.some((i) => i.id === p.megaItemId))
    .map((p) => ({ id: p.megaItemId!, name: p.megaName ?? p.name, category: p.megaCategory ? { code: "", label: p.megaCategory } : null, updatedAt: null, media: { image: "" } }));
  const all = [...items, ...removedRows];
  const categories = [...new Set(all.map((i) => i.category?.label).filter(Boolean) as string[])].sort();
  const shown = all.filter((i) => (!cat || i.category?.label === cat) && (!status || statusOf(i.id) === status) && (!q || i.name.toLowerCase().includes(q.toLowerCase()) || i.id.toLowerCase().includes(q.toLowerCase())));
  const counts = all.reduce<Record<Status, number>>((c, i) => { c[statusOf(i.id)]++; return c; }, { new: 0, draft: 0, published: 0, removed: 0 });
  const filterHref = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(cat && { cat }), ...(status && { status }), ...(q && { q }), ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/admin/mega${p.size ? `?${p}` : ""}`;
  };
  const chip = (active: boolean) => `rounded-full border px-3 py-1 text-sm ${active ? "border-brand bg-brand-soft font-medium text-brand" : "border-line bg-panel text-muted hover:text-ink"}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Mega catalog</h1>
          <p className="mt-1 text-sm text-muted">Items from the Mega Live Mall. Add them to the store, set a price and category, then publish. Only published items appear on the website.</p>
        </div>
        <form action={syncMegaNow}>
          <input type="hidden" name="cat" value={cat} /><input type="hidden" name="status" value={status} /><input type="hidden" name="q" value={q} />
          <button className="btn-primary py-2"><RefreshCw className="size-4" />Sync with Mega</button>
        </form>
      </div>

      {msg && <p role="status" className="rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand">{msg}</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">Couldn&apos;t load the Mega catalog: {error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Link href={filterHref({ status: "" })} className={chip(!status)}>All ({all.length})</Link>
        {(Object.keys(statusLabel) as Status[]).map((s) => <Link key={s} href={filterHref({ status: s })} className={chip(status === s)}>{statusLabel[s]} ({counts[s]})</Link>)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={filterHref({ cat: "" })} className={chip(!cat)}>All categories</Link>
        {categories.map((c) => <Link key={c} href={filterHref({ cat: c })} className={chip(cat === c)}>{c}</Link>)}
        <form action="/admin/mega" role="search" className="ml-auto flex w-full max-w-xs items-center gap-2 rounded-xl border border-line bg-panel px-3 focus-within:border-brand">
          <input type="hidden" name="cat" value={cat} /><input type="hidden" name="status" value={status} />
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Search name or ID" aria-label="Search Mega items" className="h-10 w-full bg-transparent text-sm outline-none" />
          {q && <Link href={filterHref({ q: "" })} aria-label="Clear search" className="rounded-md p-1 text-muted hover:text-ink"><X className="size-4" /></Link>}
        </form>
      </div>

      <form id="mega-items" className="flex flex-col gap-4">
        <input type="hidden" name="cat" value={cat} /><input type="hidden" name="status" value={status} /><input type="hidden" name="q" value={q} />
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel/95 p-3 backdrop-blur">
          <SelectAll form="mega-items" />
          <span className="flex-1" />
          <button formAction={importMegaItems} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface">Add to store</button>
          <button formAction={publishMegaItems} className="btn-primary py-1.5">Publish</button>
          <button formAction={unpublishMegaItems} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface">Unpublish</button>
        </div>

        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">{error ? "Nothing to show." : "No items match these filters."}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {shown.map((item) => {
              const s = statusOf(item.id);
              const p = byMega.get(item.id);
              return (
                <li key={item.id} className="relative flex flex-col overflow-hidden rounded-2xl border border-line bg-panel">
                  <label className="absolute left-2 top-2 z-10 rounded-md bg-panel/90 p-1"><input type="checkbox" name="id" value={item.id} aria-label={`Select ${item.name}`} className="size-4" /></label>
                  <div className="aspect-square bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element -- served by /mega-media, already sized by the portal */}
                    {s !== "removed" && <img src={megaImagePath(item.id)} alt={item.name} loading="lazy" className="size-full object-contain p-3" />}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="line-clamp-2 text-sm font-medium">{p?.name ?? item.name}</p>
                    <p className="text-xs text-muted">{item.category?.label ?? "Mega Live"} · {item.id}</p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusStyle[s]}`}>{statusLabel[s]}</span>
                      {p && <span className="text-xs font-medium">{p.priceCents > 0 ? money(p.priceCents) : "No price"}</span>}
                    </div>
                    {p && <Link href={`/admin/products/${p.id}`} className="text-xs font-medium text-brand hover:underline">Edit price & category →</Link>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </form>
    </div>
  );
}
