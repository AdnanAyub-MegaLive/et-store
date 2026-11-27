import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Download, Heart, LogOut, Package, Wallet } from "lucide-react";
import { cols } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logout } from "@/lib/actions/auth";
import { money, shortDate } from "@/lib/format";

export const metadata: Metadata = { title: "Your account" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function AccountPage() {
  const user = await requireUser();
  const { orders, favorites: favoritesCol, products } = await cols();
  const [myOrders, favorites, spentAgg] = await Promise.all([
    orders.find({ userId: user.id }, { projection: { status: 1, createdAt: 1, items: 1 } }).sort({ createdAt: -1 }).limit(20).toArray(),
    favoritesCol.countDocuments({ userId: user.id }),
    orders.aggregate<{ total: number }>([{ $match: { userId: user.id, status: "PAID" } }, { $group: { _id: null, total: { $sum: "$total" } } }]).toArray(),
  ]);
  const lines = myOrders.flatMap((o) => o.items.map((it) => ({ ...it, orderId: o._id, order: { status: o.status, createdAt: o.createdAt } }))).slice(0, 20);
  const prodMap = new Map(
    (await products.find({ _id: { $in: [...new Set(lines.map((l) => l.productId))] } }, { projection: { name: 1, image: 1, slug: 1 } }).toArray()).map((p) => [p._id, p]),
  );
  const items = lines.map((l) => ({ ...l, product: prodMap.get(l.productId) ?? { name: "Removed product", image: "/products/nova-ui-kit.png", slug: "" } }));
  const spent = { _sum: { total: spentAgg[0]?.total ?? 0 } };
  const paid = items.filter((i) => i.order.status === "PAID");
  const stats = [
    { label: "Purchased products", value: paid.length, icon: Package, color: "from-violet-500 to-indigo-500" },
    { label: "Orders placed", value: new Set(items.map((i) => i.orderId)).size, icon: Download, color: "from-cyan-400 to-sky-500" },
    { label: "Saved items", value: favorites, icon: Heart, color: "from-pink-500 to-rose-500" },
    { label: "Total spent", value: (spent._sum.total ?? 0) / 100, money: true, icon: Wallet, color: "from-amber-400 to-orange-500" },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Account / Overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.75px] sm:text-4xl">
            <span data-split>{greeting()},</span> <span className="text-gradient animate-fade-up inline-block [animation-delay:300ms]">{user.name.split(" ")[0]}</span>
          </h1>
          <p className="animate-fade-up mt-2 text-muted [animation-delay:200ms]">Here&apos;s what&apos;s new in your creative library.</p>
        </div>
        <form action={logout}><button className="btn-outline py-2"><LogOut className="size-4" />Sign out</button></form>
      </div>

      <div data-stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card group flex items-center justify-between p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-18px_rgba(103,48,204,0.45)]">
            <div>
              <p className="text-sm text-muted">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums" data-count={s.value} data-prefix={s.money ? "$" : undefined} data-decimals={s.money ? 2 : undefined}>
                {s.money ? money(s.value * 100) : s.value}
              </p>
            </div>
            <span className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br ${s.color} text-white shadow-md transition duration-500 group-hover:rotate-[-8deg] group-hover:scale-110`}>
              <s.icon className="size-5" />
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section data-slide="left" className="card p-6">
          <div className="mb-2 flex justify-between"><h2 className="font-semibold">Recent purchases</h2><span className="text-sm text-muted">{items.length} products</span></div>
          {items.length === 0 && <p className="py-8 text-center text-muted">No purchases yet. <Link href="/shop" className="text-brand">Find something great</Link></p>}
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-4 border-b border-line py-4 last:border-0">
              <div className="relative size-12 overflow-hidden rounded-lg"><Image src={i.product.image} alt="" fill sizes="48px" className="object-cover" /></div>
              <div className="flex-1">
                <Link href={`/products/${i.product.slug}`} className="font-medium">{i.product.name}</Link>
                <p className="text-sm text-muted">{shortDate(i.order.createdAt)} · {i.order.status === "PAID" ? "Ready to download" : i.order.status.toLowerCase()}</p>
              </div>
              {i.order.status === "PAID" && (
                <a href={`/api/download/${i.id}`} className="btn-primary px-3 py-2"><Download className="size-4" />Download</a>
              )}
            </div>
          ))}
        </section>
        <aside className="card flex h-fit flex-col gap-3 p-6">
          <h2 className="font-semibold">Continue exploring</h2>
          {[["Rides", "Arrive in style", "ride"], ["Entrances", "Make every entry unforgettable", "entrance"], ["Room BG", "Give your room a fresh look", "room-bg"]].map(([t, s, c]) => (
            <Link key={t} href={`/shop?category=${c}`} className="rounded-xl border border-line bg-surface p-3 hover:bg-brand-soft/50">
              <p className="font-medium">{t}</p><p className="text-sm text-muted">{s}</p>
            </Link>
          ))}
          <Link href="/shop" className="btn-primary py-2">Browse all products</Link>
        </aside>
      </div>
    </div>
  );
}
