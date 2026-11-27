import Link from "next/link";
import { Box, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { cols, withOrderProducts } from "@/lib/db";
import { money, shortDate } from "@/lib/format";
import { AreaChart, Donut } from "./charts";
import { StatusBadge } from "./status-badge";

const RANGES = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 } as const;
type RangeKey = keyof typeof RANGES;

function pct(now: number, prev: number) {
  if (!prev) return now ? "+100%" : "0%";
  const p = ((now - prev) / prev) * 100;
  return `${p >= 0 ? "+" : ""}${p.toFixed(1)}%`;
}

function windowFor(days: number) {
  const now = Date.now();
  return { now, since: new Date(now - days * 864e5), prevSince: new Date(now - 2 * days * 864e5) };
}

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const r = ((await searchParams).range ?? "30d") as RangeKey;
  const range: RangeKey = r in RANGES ? r : "30d";
  const days = RANGES[range];
  const { now, since, prevSince } = windowFor(days);

  const { orders, users, products: productsCol } = await cols();
  const sumPaid = async (createdAt: { $gte: Date; $lt?: Date }) => {
    const [r] = await orders.aggregate<{ total: number; n: number }>([{ $match: { status: "PAID", createdAt } }, { $group: { _id: null, total: { $sum: "$total" }, n: { $sum: 1 } } }]).toArray();
    return { _sum: { total: r?.total ?? 0 }, _count: r?.n ?? 0 };
  };
  const [paidNow, paidPrev, ordersNow, ordersPrev, customers, customersPrev, products, paidOrders, recent] = await Promise.all([
    sumPaid({ $gte: since }),
    sumPaid({ $gte: prevSince, $lt: since }),
    orders.countDocuments({ createdAt: { $gte: since } }),
    orders.countDocuments({ createdAt: { $gte: prevSince, $lt: since } }),
    users.countDocuments({ role: "USER" }),
    users.countDocuments({ role: "USER", createdAt: { $lt: since } }),
    productsCol.countDocuments({ published: true }),
    // Paid orders in the window, summed in JS (works on MongoDB; no SQL GROUP BY).
    orders.find({ status: "PAID", createdAt: { $gte: since } }, { projection: { createdAt: 1, total: 1, items: 1 } }).toArray().then(withOrderProducts),
    orders.find({}).sort({ createdAt: -1 }).limit(6).toArray().then(withOrderProducts),
  ]);

  const dayTotals = new Map<string, number>();
  const catTotals = new Map<string, number>();
  const units = new Map<string, number>();
  for (const o of paidOrders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    dayTotals.set(day, (dayTotals.get(day) ?? 0) + o.total);
    for (const it of o.items) {
      const cat = it.product.category.name;
      catTotals.set(cat, (catTotals.get(cat) ?? 0) + it.priceCents * it.quantity);
      units.set(it.product.name, (units.get(it.product.name) ?? 0) + it.quantity);
    }
  }
  const byCategory = [...catTotals].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  const top = [...units].map(([name, n]) => ({ name, units: n })).sort((a, b) => b.units - a.units).slice(0, 4);

  const revenue = paidNow._sum.total ?? 0;
  const map = dayTotals;
  const points = Array.from({ length: Math.min(days, 90) + 1 }, (_, i) => {
    const d = new Date(now - (Math.min(days, 90) - i) * 864e5);
    return { label: shortDate(d), value: (map.get(d.toISOString().slice(0, 10)) ?? 0) / 100 };
  });
  const slices = byCategory.slice(0, 3).map((c) => ({ label: c.name, value: Number(c.total) }));
  const other = byCategory.slice(3).reduce((s, c) => s + Number(c.total), 0);
  if (other) slices.push({ label: "Other", value: other });
  const topMax = Math.max(1, ...top.map((t) => Number(t.units)));

  const stats = [
    { label: "Total revenue", value: money(revenue), raw: revenue / 100, money: true, delta: pct(revenue, paidPrev._sum.total ?? 0), icon: TrendingUp, color: "from-violet-500 to-fuchsia-500" },
    { label: "Orders", value: ordersNow.toLocaleString(), raw: ordersNow, delta: pct(ordersNow, ordersPrev), icon: ShoppingCart, color: "from-cyan-400 to-sky-500" },
    { label: "Customers", value: customers.toLocaleString(), raw: customers, delta: pct(customers, customersPrev), icon: Users, color: "from-pink-500 to-rose-500" },
    { label: "Products", value: products.toLocaleString(), raw: products, delta: "live", icon: Box, color: "from-amber-400 to-orange-500" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Overview</h1>
          <p className="mt-1 text-sm text-muted">Here&apos;s how your marketplace is performing.</p>
        </div>
        <div className="flex rounded-xl bg-surface p-1 text-sm">
          {(Object.keys(RANGES) as RangeKey[]).map((k) => (
            <Link key={k} href={`/admin?range=${k}`} className={`rounded-lg px-3 py-1.5 ${k === range ? "bg-panel shadow-sm" : "text-muted"}`}>{k.toUpperCase()}</Link>
          ))}
        </div>
      </div>

      <div data-stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card group p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-18px_rgba(103,48,204,0.45)]">
            <div className="flex items-center justify-between text-sm text-muted">
              {s.label}
              <span className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow transition duration-500 group-hover:rotate-[-8deg] group-hover:scale-110`}><s.icon className="size-4" /></span>
            </div>
            <p className="mt-5 text-2xl font-semibold tabular-nums" data-count={s.raw} data-prefix={s.money ? "$" : undefined} data-decimals={s.money ? 2 : undefined}>{s.value}</p>
            <p className={`mt-1 text-xs font-medium ${s.delta.startsWith("-") ? "text-rose-500" : "text-emerald-600"}`}>{s.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_260px]">
        <section className="card p-6">
          <h2 className="font-semibold">Revenue overview</h2>
          <p className="text-sm text-muted">Performance over the selected period (USD)</p>
          <div className="mt-4"><AreaChart points={points} /></div>
          <div className="mt-4 flex gap-10 border-t border-line pt-4">
            <div><p className="text-xs text-muted">Gross revenue</p><p className="text-xl font-semibold">{money(revenue, 0)}</p></div>
            <div><p className="text-xs text-muted">Avg. order</p><p className="text-xl font-semibold">{money(paidNow._count ? Math.round(revenue / paidNow._count) : 0)}</p></div>
          </div>
        </section>
        <section className="card p-6">
          <h2 className="font-semibold">Sales by category</h2>
          <p className="mb-6 text-sm text-muted">Share of total sales</p>
          {slices.length ? <Donut slices={slices} /> : <p className="text-sm text-muted">No paid sales in this period.</p>}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_260px]">
        <section className="card overflow-x-auto p-6">
          <div className="flex items-center justify-between">
            <div><h2 className="font-semibold">Recent orders</h2><p className="text-sm text-muted">Latest marketplace activity</p></div>
            <Link href="/admin/orders" className="text-sm font-medium text-brand">View all</Link>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead><tr className="border-b border-line text-left">{["Order", "Customer", "Product", "Date", "Status"].map((h) => <th key={h} className="px-2 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-2 py-3 font-mono text-xs">LM-{o.number}</td>
                  <td className="px-2 py-3">{o.firstName} {o.lastName}</td>
                  <td className="px-2 py-3">{o.items[0]?.product.name}</td>
                  <td className="px-2 py-3">{shortDate(o.createdAt)}</td>
                  <td className="px-2 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card p-6">
          <h2 className="font-semibold">Top products</h2>
          <p className="mb-4 text-sm text-muted">Best performers this period</p>
          {top.map((t, i) => (
            <div key={t.name} className="py-3">
              <div className="flex justify-between gap-2 text-sm"><span><span className="mr-2 font-mono text-xs text-muted">0{i + 1}</span>{t.name}</span><span className="text-xs text-muted">{Number(t.units)}</span></div>
              <div className="mt-2 h-1.5 rounded-full bg-surface"><div className="h-full rounded-full bg-brand" style={{ width: `${(Number(t.units) / topMax) * 100}%` }} /></div>
            </div>
          ))}
          {!top.length && <p className="text-sm text-muted">No sales yet.</p>}
        </section>
      </div>
    </div>
  );
}
