import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { SITE } from "@/lib/site";
import { FaqSearch, type FaqGroup } from "./faq";

export const metadata: Metadata = { title: "Help Center", description: "Answers about downloads, licences, payments, refunds and your account." };

const FAQ: FaqGroup[] = [
  {
    title: "Downloads",
    color: "from-cyan-400 to-sky-500",
    items: [
      { q: "Where do I find my downloads?", a: "Sign in and open your account page. Every paid product appears under Recent purchases with a Download button." },
      { q: "When can I download after paying?", a: "Right away. As soon as Stripe confirms your payment, the product unlocks in your account, usually within a few seconds." },
      { q: "Do download links expire?", a: "No. Your purchases stay in your library for as long as your account exists, including future updates." },
      { q: "I checked out without an account. What now?", a: "Create an account with the same email address you used at checkout and contact us. We'll link your order to it." },
    ],
  },
  {
    title: "Licences",
    color: "from-violet-500 to-indigo-500",
    items: [
      { q: "Can I use products in client work?", a: "Yes. The standard licence covers unlimited personal and commercial projects, including work for clients." },
      { q: "Can I resell or share the files?", a: "No. You can't resell, redistribute or share the original source files, even for free." },
      { q: "Do I need one licence per team member?", a: "Each purchase covers one person. Teams should buy one copy per person who uses the files." },
    ],
  },
  {
    title: "Payments",
    color: "from-pink-500 to-rose-500",
    items: [
      { q: "Which payment methods do you accept?", a: "All major cards, Apple Pay, Google Pay and Link, processed securely by Stripe." },
      { q: "Do you store my card details?", a: "Never. You pay on Stripe's secure checkout page, so your card details never reach our servers." },
      { q: "Why was tax added at checkout?", a: "Sales tax is added to every order at checkout. You'll always see the exact amount in the order summary before you pay." },
    ],
  },
  {
    title: "Refunds",
    color: "from-amber-400 to-orange-500",
    items: [
      { q: "Can I get a refund?", a: `Yes. If a product doesn't work as described, request a refund within ${SITE.refundDays} days of purchase through our contact form.` },
      { q: "How long does a refund take?", a: "Once approved, Stripe returns the money to your original payment method, usually within 5 to 10 business days." },
    ],
  },
  {
    title: "Account",
    color: "from-emerald-400 to-teal-500",
    items: [
      { q: "I forgot my password.", a: "Use Forgot password on the sign-in page. We'll email you a reset link that works for 30 minutes." },
      { q: "How do I delete my account?", a: "Contact us from the email address on your account and we'll delete it and your personal data, as described in our Privacy Policy." },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <PageHero center crumb="Help Center" eyebrow="HELP CENTER" title="How can we" highlight="help you?" intro="Search common questions about downloads, licences, payments, refunds and your account." />
      <FaqSearch groups={FAQ} />
      <section data-pop className="mx-auto mb-16 mt-12 flex max-w-3xl flex-col items-center gap-3 rounded-[18px] bg-surface p-8 text-center">
        <h2 className="text-xl font-semibold">Still need help?</h2>
        <p className="text-muted">Our team replies {SITE.responseTime}.</p>
        <Link href="/contact" className="btn-primary">Contact support</Link>
      </section>
    </div>
  );
}
