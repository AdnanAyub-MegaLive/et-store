import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { deleteProduct } from "@/lib/actions/admin";

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
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${p.id}`} className="mr-4 text-brand">Edit</Link>
                  <form action={deleteProduct} className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-red-600" title={p._count.orderItems ? "Has orders, so it will be unpublished" : "Delete"}>{p._count.orderItems ? "Unpublish" : "Delete"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
