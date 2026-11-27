"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useCart } from "@/components/cart";
import { useCartProducts } from "@/components/use-cart-products";
import { placeOrder } from "@/lib/actions/store";
import { money, TAX_RATE } from "@/lib/format";

const Field = ({ label, name, ...rest }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="block">
    <span className="label">{label}</span>
    <input name={name} required className="input" {...rest} />
  </label>
);

export default function CheckoutPage() {
  return (
    <Suspense>
      <Checkout />
    </Suspense>
  );
}

function Checkout() {
  const { lines } = useCart();
  const { rows, subtotal } = useCartProducts();
  const [pending, start] = useTransition();
  const canceled = useSearchParams().get("canceled") === "1";
  const [error, setError] = useState(canceled ? "Payment was canceled. Your cart is still here." : "");
  const tax = Math.round(subtotal * TAX_RATE);

  const submit = (form: FormData) =>
    start(async () => {
      setError("");
      const r = await placeOrder({ ...Object.fromEntries(form), items: lines.map((l) => ({ id: l.id, qty: l.qty })) });
      if (r.error) setError(r.error);
      else if (r.url?.startsWith("https://checkout.stripe.com/")) window.location.assign(r.url);
      else setError("Payment could not be started.");
    });

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <p className="text-sm text-muted"><Link href="/">Home</Link> / <Link href="/cart">Cart</Link> / Checkout</p>
      <h1 data-split className="mt-2 text-3xl font-semibold tracking-[-0.75px] sm:text-4xl">Checkout</h1>
      <ol className="mt-4 flex items-center gap-4 text-sm">
        {["Information", "Payment", "Confirmation"].map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={`grid size-6 place-items-center rounded-full text-xs ${i === 0 ? "bg-gradient-brand text-on-brand shadow-md ring-4 ring-brand/15" : "bg-surface text-muted"}`}>{i + 1}</span>
            <span className={i === 0 ? "text-brand" : "text-muted"}>{s}</span>
            {i < 2 && <span className="ml-2 h-px w-12 bg-line" />}
          </li>
        ))}
      </ol>

      <form action={submit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div data-stagger className="flex flex-col gap-6">
          <section className="card flex flex-col gap-4 border-l-4 border-l-violet-400 p-6">
            <h2 className="font-semibold">Contact information</h2>
            <Field label="Email address" name="email" type="email" autoComplete="email" maxLength={254} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="optin" className="accent-brand" />Email me about new releases and member perks</label>
          </section>
          <section className="card grid gap-4 border-l-4 border-l-pink-400 p-6 sm:grid-cols-2">
            <h2 className="font-semibold sm:col-span-2">Billing details</h2>
            <Field label="First name" name="firstName" autoComplete="given-name" maxLength={60} />
            <Field label="Last name" name="lastName" autoComplete="family-name" maxLength={60} />
            <label className="block sm:col-span-2">
              <span className="label">Country</span>
              <select name="country" className="input w-auto" defaultValue="United States">
                {["United States", "United Kingdom", "Canada", "Pakistan", "Germany", "Australia", "Other"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <div className="sm:col-span-2"><Field label="Address" name="address" autoComplete="street-address" maxLength={200} /></div>
            <Field label="City" name="city" autoComplete="address-level2" maxLength={80} />
            <Field label="State" name="state" autoComplete="address-level1" maxLength={80} />
            <div className="sm:col-span-2"><Field label="ZIP" name="zip" autoComplete="postal-code" maxLength={12} /></div>
          </section>
          <section className="card flex flex-col gap-3 border-l-4 border-l-cyan-400 p-6">
            <h2 className="font-semibold">Payment method</h2>
            {["Credit or debit card", "Apple Pay / Google Pay", "Link"].map((m) => (
              <p key={m} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm">
                <Lock className="size-4 text-brand" />{m}
              </p>
            ))}
            <p className="rounded-xl bg-surface p-4 text-sm text-muted">
              You&apos;ll pay on Stripe&apos;s secure checkout page. Your card details never touch our servers.
            </p>
          </section>
        </div>

        <aside data-slide="right" className="card h-fit border-t-4 border-t-fuchsia-400 p-6 text-sm lg:sticky lg:top-24">
          <h2 className="mb-4 text-base font-semibold">Order summary</h2>
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-2">
              <div className="relative size-10 overflow-hidden rounded-lg"><Image src={r.image} alt="" fill sizes="40px" className="object-contain" /></div>
              <span className="flex-1">{r.name}{r.qty > 1 && ` ×${r.qty}`}</span>
              <span>{money(r.priceCents * r.qty, 0)}</span>
            </div>
          ))}
          <div className="mt-4 border-t border-line pt-4">
            <p className="flex justify-between py-1"><span className="text-muted">Subtotal</span>{money(subtotal)}</p>
            <p className="flex justify-between py-1"><span className="text-muted">Tax</span>{money(tax)}</p>
            <p className="mt-2 flex justify-between border-t border-line pt-3 text-base font-semibold"><span>Total</span>{money(subtotal + tax)}</p>
          </div>
          {error && <p className="mt-3 text-red-600" role="alert">{error}</p>}
          <button disabled={pending || !rows.length} className="btn-primary mt-4 w-full py-2.5">
            <Lock className="size-4" />{pending ? "Placing order…" : `Place order · ${money(subtotal + tax)}`}
          </button>
          <p className="mt-3 text-center text-xs text-muted">By placing your order, you agree to our <Link href="/terms" className="text-brand underline-offset-2 hover:underline">Terms</Link> and <Link href="/terms#refunds" className="text-brand underline-offset-2 hover:underline">refund policy</Link>.</p>
        </aside>
      </form>
    </div>
  );
}
