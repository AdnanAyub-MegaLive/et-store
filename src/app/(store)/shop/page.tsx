import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { accentFor } from "@/components/icons";

export const metadata: Metadata = { title: "All digital products" };

const PAGE_SIZE = 9;
const SORTS = { featured: "Featured", newest: "Newest", "price-asc": "Price: low to high", "price-desc": "Price: high to low", rating: "Top rated" } as const;

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

export default async function Shop({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 100);
  const cats = many(sp.category).slice(0, 10);
  // Optional price range in whole dollars; empty means no limit. Swapped if entered the wrong way round.
  const dollars = (v: string) => (v.trim() === "" || !Number.isFinite(Number(v)) ? null : Math.min(Math.max(Math.floor(Number(v)), 0), 100_000));
  let minPrice = dollars(one(sp.min));
  let maxPrice = dollars(one(sp.max));
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
  const sort = (one(sp.sort) in SORTS ? one(sp.sort) : "featured") as keyof typeof SORTS;
  const page = Math.max(1, Math.floor(Number(one(sp.page)) || 1));

  const where: Prisma.ProductWhereInput = {
    published: true,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { tagline: { contains: q, mode: "insensitive" } },
        { creator: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
    ...(cats.length && { category: { slug: { in: cats } } }),
    ...((minPrice !== null || maxPrice !== null) && {
      priceCents: {
        ...(minPrice !== null && { gte: minPrice * 100 }),
        ...(maxPrice !== null && { lte: maxPrice * 100 }),
      },
    }),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = {
    featured: [{ featured: "desc" as const }, { reviewCount: "desc" as const }],
    newest: [{ createdAt: "desc" as const }],
    "price-asc": [{ priceCents: "asc" as const }],
    "price-desc": [{ priceCents: "desc" as const }],
    rating: [{ rating: "desc" as const }],
  }[sort];

  const [categories, total, products] = await Promise.all([
    db.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], include: { _count: { select: { products: { where: { published: true } } } } } }),
    db.product.count({ where }),
    db.product.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { category: { select: { name: true } } } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    cats.forEach((c) => u.append("category", c));
    if (minPrice !== null) u.set("min", String(minPrice));
    if (maxPrice !== null) u.set("max", String(maxPrice));
    if (sort !== "featured") u.set("sort", sort);
    if (p > 1) u.set("page", String(p));
    return `/shop${u.size ? `?${u}` : ""}`;
  };

  // key: remount the form when the URL changes so checkboxes and inputs reset (e.g. after "Clear all").
  return (
    <form key={href(page)} action="/shop" className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <p className="text-sm text-muted">
        <Link href="/">Home</Link> / Browse
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.75px] sm:text-4xl">
        <span data-split>All digital</span> <span className="text-gradient animate-fade-up inline-block [animation-delay:300ms]">products</span>
      </h1>
      <p className="animate-fade-up mt-2 text-muted [animation-delay:200ms]">Find the tools that make your next project easier.</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-line bg-panel px-3">
          <Search className="size-4 text-muted" />
          <input name="q" defaultValue={q} placeholder="Search by product, category, or creator" className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted" />
        </label>
        <button className="btn-outline py-2"><SlidersHorizontal className="size-4" />Filters</button>
        <select name="sort" defaultValue={sort} aria-label="Sort" className="input w-48">
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>Sort by: {v}</option>)}
        </select>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside data-slide="left" className="flex h-fit flex-col gap-6 rounded-[18px] border border-line bg-panel/70 p-5 text-sm backdrop-blur lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Filters</h2>
            <Link href="/shop" className="text-brand">Clear all</Link>
          </div>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 font-semibold">Category</legend>
            {categories.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-lg transition hover:text-brand">
                <input type="checkbox" name="category" value={c.slug} defaultChecked={cats.includes(c.slug)} className="size-4 accent-brand" />
                <span className={`size-2 rounded-full bg-gradient-to-br ${accentFor(c.slug).tile}`} />
                <span className="flex-1">{c.name}</span>
                <span className={`rounded-full px-2 text-xs ${accentFor(c.slug).tint} ${accentFor(c.slug).text}`}>{c._count.products}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold">Price ($)</legend>
            <div className="flex items-center gap-2">
              <label className="flex flex-1 items-center rounded-xl border border-line bg-surface px-2.5 transition focus-within:border-brand">
                <span className="text-muted">$</span>
                <input type="number" name="min" min={0} step={1} inputMode="numeric" placeholder="Min" aria-label="Minimum price" defaultValue={minPrice ?? ""} className="h-9 w-full min-w-0 bg-transparent px-1 outline-none placeholder:text-muted" />
              </label>
              <span className="text-muted">to</span>
              <label className="flex flex-1 items-center rounded-xl border border-line bg-surface px-2.5 transition focus-within:border-brand">
                <span className="text-muted">$</span>
                <input type="number" name="max" min={0} step={1} inputMode="numeric" placeholder="Max" aria-label="Maximum price" defaultValue={maxPrice ?? ""} className="h-9 w-full min-w-0 bg-transparent px-1 outline-none placeholder:text-muted" />
              </label>
            </div>
          </fieldset>
          <button className="btn-primary py-2">Apply filters</button>
        </aside>

        <div>
          <p className="mb-4 text-sm text-muted">Showing {products.length} of {total.toLocaleString()} products</p>
          {products.length ? (
            <div data-stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p, i) => <ProductCard key={p.id} p={p} showCount priority={i < 3} />)}
            </div>
          ) : (
            <div className="card p-10 text-center text-muted">No products match these filters.</div>
          )}
          {pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2 text-sm" aria-label="Pagination">
              <Link aria-disabled={page === 1} href={href(Math.max(1, page - 1))} className={`btn-outline px-3 py-2 ${page === 1 ? "pointer-events-none opacity-50" : ""}`}><ChevronLeft className="size-4" />Previous</Link>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={href(n)} aria-current={n === page ? "page" : undefined} className={`grid size-9 place-items-center rounded-xl transition hover:-translate-y-0.5 ${n === page ? "bg-gradient-brand text-on-brand shadow-md" : "border border-line bg-panel hover:border-brand/40"}`}>{n}</Link>
              ))}
              <Link aria-disabled={page === pages} href={href(Math.min(pages, page + 1))} className={`btn-outline px-3 py-2 ${page === pages ? "pointer-events-none opacity-50" : ""}`}>Next<ChevronRight className="size-4" /></Link>
            </nav>
          )}
        </div>
      </div>
    </form>
  );
}
