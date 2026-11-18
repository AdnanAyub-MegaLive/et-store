import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { setProductPublished } from "@/lib/actions/admin";
import { DeleteButton } from "./delete-button";

const action = "rounded-lg px-2.5 py-1 font-medium transition hover:underline";

export default async function ProductsPage() {
  const products = await db.product.findMany({ orderBy: { createdAt: "desc" }, include: { category: { select: { name: true } }, _count: { select: { orderItems: true } } } });
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new" className="btn-primary py-2"><Plus className="size-4" />New product</Link>
      </div>
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
                    {p._count.orderItems ? (
                      <span className={`${action} cursor-not-allowed text-muted opacity-50 hover:no-underline`} title="This product has orders, so it can't be deleted. Use Draft to hide it.">Delete</span>
                    ) : (
                      <DeleteButton id={p.id} name={p.name} className={`${action} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/15`} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
