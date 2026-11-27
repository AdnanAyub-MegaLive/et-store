import Image from "next/image";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { cols, escapeRegex, withCategories } from "@/lib/db";
import { money } from "@/lib/format";
import { duplicateProduct, setProductPublished } from "@/lib/actions/admin";
import { DeleteButton } from "./delete-button";
import { SyncButton } from "./sync-button";

const action = "rounded-lg px-2.5 py-1 font-medium transition hover:underline";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").trim().slice(0, 100);
  const { products: productsCol, categories, orders } = await cols();
  const rx = { $regex: escapeRegex(q), $options: "i" };
  const catIds = q ? await categories.distinct("_id", { name: rx }) : [];
  const list = await withCategories(
    await productsCol.find(q ? { $or: [{ name: rx }, { slug: rx }, { categoryId: { $in: catIds } }] } : {}).sort({ createdAt: -1 }).toArray(),
  );
  const sold = new Map(
    (
      await orders
        .aggregate<{ _id: string; n: number }>([{ $unwind: "$items" }, { $match: { "items.productId": { $in: list.map((p) => p.id) } } }, { $group: { _id: "$items.productId", n: { $sum: 1 } } }])
        .toArray()
    ).map((r) => [r._id, r.n]),
  );
  const products = list.map((p) => ({ ...p, _count: { orderItems: sold.get(p.id) ?? 0 } }));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <form action="/admin/products" role="search" className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-line bg-panel px-3 transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
            <Search className="size-4 shrink-0 text-muted" aria-hidden />
            <input name="q" defaultValue={q} placeholder="Search by name or category" aria-label="Search products" className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted" />
            {q && <Link href="/admin/products" aria-label="Clear search" className="rounded-md p-1 text-muted hover:bg-surface hover:text-ink"><X className="size-4" /></Link>}
          </form>
          {process.env.PARTNER_API_URL && <SyncButton />}
          <Link href="/admin/products/new" className="btn-primary py-2"><Plus className="size-4" />New product</Link>
        </div>
      </div>
      {q && <p className="-mt-3 text-sm text-muted">{products.length} result{products.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left">{["Product", "Category", "Price", "Sold", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 overflow-hidden rounded-lg bg-surface"><Image src={p.image} alt="" fill sizes="40px" className="object-cover" /></div>
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-brand">{p.name}</Link>
                  </div>
                </td>
                <td className="px-4 py-3">{p.category.name}</td>
                <td className="px-4 py-3">{money(p.priceCents)}</td>
                <td className="px-4 py-3">{p._count.orderItems}</td>
                <td className="px-4 py-3">{p.published ? <span className="text-brand">Published</span> : <span className="text-muted">Draft</span>}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <Link href={`/admin/products/${p.id}`} className={`${action} text-brand hover:bg-brand-soft`}>Edit</Link>
                    <form action={setProductPublished} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="published" value={p.published ? "0" : "1"} />
                      {p.published ? (
                        <button className={`${action} text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/15`} title="Hide from the store">Draft</button>
                      ) : (
                        <button className={`${action} text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/15`} title="Show in the store">Publish</button>
                      )}
                    </form>
                    <form action={duplicateProduct} className="inline">
                      <input type="hidden" name="id" value={p.id} />
                      <button className={`${action} text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/15`} title="Make a copy as a draft">Duplicate</button>
                    </form>
                    {p._count.orderItems ? (
                      <span className={`${action} cursor-not-allowed text-muted opacity-50 hover:no-underline`} title="This product has orders, so it can't be deleted. Use Draft to hide it.">Delete</span>
                    ) : (
                      <DeleteButton id={p.id} name={p.name} className={`${action} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/15`} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">{q ? "No products match your search." : "No products yet."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
