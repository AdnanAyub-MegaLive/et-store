import Link from "next/link";
import { Search } from "lucide-react";
import type { Filter } from "mongodb";
import { cols, escapeRegex, withOrderProducts, type Doc, type Order, type OrderStatus } from "@/lib/db";
import { money, shortDate } from "@/lib/format";
import { setOrderStatus } from "@/lib/actions/admin";
import { StatusBadge } from "../status-badge";

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "REFUNDED", "CANCELLED"];
const PAGE = 20;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 100).trim();
  const status = STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const num = Number(q.replace(/^LM-/i, ""));

  const { orders: ordersCol, products } = await cols();
  const rx = { $regex: escapeRegex(q), $options: "i" };
  const productIds = q ? await products.distinct("_id", { name: rx }) : [];
  const where: Filter<Doc<Order>> = {
    ...(status && { status }),
    ...(q && {
      $or: [
        ...(Number.isInteger(num) && num > 0 ? [{ number: num }] : []),
        { email: rx },
        { firstName: rx },
        { lastName: rx },
        { "items.productId": { $in: productIds } },
      ],
    }),
  };
  const [total, orders] = await Promise.all([
    ordersCol.countDocuments(where),
    ordersCol.find(where).sort({ createdAt: -1 }).skip((page - 1) * PAGE).limit(PAGE).toArray().then(withOrderProducts),
  ]);
  const pages = Math.ceil(total / PAGE);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <form className="flex flex-wrap gap-3">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-panel px-3">
          <Search className="size-4 text-muted" />
          <input name="q" defaultValue={q} placeholder="Search orders, customers, products" className="h-10 w-full bg-transparent text-sm outline-none" />
        </label>
        <select name="status" defaultValue={status ?? ""} className="input w-44">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}
        </select>
        <button className="btn-primary py-2">Filter</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left">{["Order", "Customer", "Items", "Total", "Date", "Status", "Update"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono text-xs">LM-{o.number}</td>
                <td className="px-4 py-3"><p>{o.firstName} {o.lastName}</p><p className="text-xs text-muted">{o.email}</p></td>
                <td className="px-4 py-3">{o.items.map((i) => i.product.name).join(", ")}</td>
                <td className="px-4 py-3">{money(o.total)}</td>
                <td className="px-4 py-3">{shortDate(o.createdAt)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3">
                  <form action={setOrderStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    <select name="status" defaultValue={o.status} className="rounded-lg border border-line px-2 py-1 text-xs">
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <button className="text-xs font-medium text-brand">Save</button>
                  </form>
                </td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={7} className="p-8 text-center text-muted">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex gap-2 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={`?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: String(n) })}`} className={`grid size-8 place-items-center rounded-lg ${n === page ? "bg-brand text-on-brand" : "border border-line bg-panel"}`}>{n}</Link>
          ))}
        </div>
      )}
    </div>
  );
}
