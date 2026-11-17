"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Lock, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart";
import { useCartProducts } from "@/components/use-cart-products";
import { money } from "@/lib/format";

export default function CartPage() {
  const { setQty, remove } = useCart();
  const { rows, subtotal, loading } = useCartProducts();

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <p className="text-sm text-muted"><Link href="/">Home</Link> / Cart</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.75px] sm:text-4xl">
        <span data-split>Your</span> <span className="text-gradient animate-fade-up inline-block [animation-delay:250ms]">cart</span>
      </h1>
      <p className="mt-2 text-sm text-muted">{rows.length} products · Instant access after checkout</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section data-slide="left" className="card p-6">
          <h2 className="mb-2 font-semibold">Cart items</h2>
          {loading ? (
            <p className="py-10 text-center text-muted">Loading…</p>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-muted">
              Your cart is empty. <Link href="/shop" className="text-brand">Browse products</Link>
            </div>
          ) : (
            <AnimatePresence initial={true}>
            {rows.map((r, i) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08, type: "spring", stiffness: 260, damping: 24 } }}
                exit={{ opacity: 0, x: -80, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.35 } }}
                className="flex items-center gap-4 overflow-hidden border-b border-line py-6"
              >
                <div className="relative size-[74px] shrink-0 overflow-hidden rounded-xl">
                  <Image src={r.image} alt={r.name} fill sizes="74px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${r.slug}`} className="font-medium">{r.name}</Link>
                  <p className="text-sm text-muted">{r.category.name} · {r.format}</p>
                </div>
                <div className="flex items-center rounded-xl border border-line">
                  <button aria-label="Decrease" className="p-2" onClick={() => setQty(r.id, r.qty - 1)}><Minus className="size-4" /></button>
                  <span className="w-6 text-center text-sm">{r.qty}</span>
                  <button aria-label="Increase" className="p-2" onClick={() => setQty(r.id, r.qty + 1)}><Plus className="size-4" /></button>
                </div>
                <p className="w-20 text-right font-medium">{money(r.priceCents * r.qty)}</p>
                <motion.button whileHover={{ scale: 1.15, rotate: -8 }} whileTap={{ scale: 0.85 }} aria-label={`Remove ${r.name}`} onClick={() => remove(r.id)} className="text-muted hover:text-red-600"><Trash2 className="size-4" /></motion.button>
              </motion.div>
            ))}
            </AnimatePresence>
          )}
        </section>

        <aside data-slide="right" className="card h-fit border-t-4 border-t-fuchsia-400 p-6 text-sm">
          <h2 className="mb-4 text-base font-semibold">Order summary</h2>
          <p className="flex justify-between py-2"><span className="text-muted">Subtotal</span>{money(subtotal)}</p>
          <p className="flex justify-between border-b border-line py-2 pb-4"><span className="text-muted">Discount</span>-$0.00</p>
          <p className="flex justify-between py-4 font-semibold">
            <span>Total</span>
            <motion.span key={subtotal} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className="text-lg">
              {money(subtotal)}
            </motion.span>
          </p>
          <p className="text-muted">Taxes calculated at checkout</p>
          <Link href="/checkout" aria-disabled={!rows.length} className={`btn-primary mt-6 w-full py-2.5 ${rows.length ? "" : "pointer-events-none opacity-50"}`}>
            Proceed to checkout <ArrowRight className="size-4" />
          </Link>
          <Link href="/shop" className="mt-4 block text-center font-medium text-brand">Continue shopping</Link>
        </aside>
      </div>

      <div data-pop className="mt-8 flex items-center gap-4 rounded-[18px] border border-line bg-gradient-to-r from-violet-50 via-pink-50 to-amber-50 dark:from-violet-500/10 dark:via-pink-500/10 dark:to-amber-500/10 p-6">
        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow"><Lock className="size-4" /></span>
        <p className="font-medium">Secure checkout</p>
        <p className="text-sm text-muted">Download links never expire</p>
      </div>
    </div>
  );
}
