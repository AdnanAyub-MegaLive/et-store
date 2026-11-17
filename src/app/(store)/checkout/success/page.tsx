import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ClearCart } from "./clear-cart";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const n = Number((await searchParams).order);
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <ClearCart />
      <span data-pop="0.1" className="bg-gradient-brand mx-auto grid size-20 place-items-center rounded-full text-white shadow-[0_20px_40px_-15px_rgba(219,39,119,0.6)]">
        <CheckCircle2 className="size-10" />
      </span>
      <h1 data-split className="mt-6 text-3xl font-semibold">Thank you for your order</h1>
      <p className="mt-2 text-muted">
        {Number.isInteger(n) && n > 0 ? `Order LM-${n} is being confirmed. ` : ""}A receipt is on its way to your email, and your downloads will appear in your account in a moment.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/account" className="btn-primary">Go to my library</Link>
        <Link href="/shop" className="btn-outline">Keep browsing</Link>
      </div>
    </div>
  );
}
