import Link from "next/link";
import type { Metadata } from "next";
import { Globe, HeartHandshake, Laptop, Sprout } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Careers", description: "Work with the ET-Store team." };

const PERKS = [
  { icon: Globe, title: "Remote first", text: "Work from wherever you do your best thinking.", color: "from-cyan-400 to-sky-500" },
  { icon: Laptop, title: "Great tools", text: "A yearly budget for gear, software and ET-Store products.", color: "from-violet-500 to-indigo-500" },
  { icon: Sprout, title: "Room to grow", text: "Time and budget set aside for learning every quarter.", color: "from-emerald-400 to-teal-500" },
  { icon: HeartHandshake, title: "Small, kind team", text: "Clear ownership, few meetings, and people who care about craft.", color: "from-pink-500 to-rose-500" },
];

export default function CareersPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <PageHero
        crumb="Careers"
        eyebrow="JOIN US"
        title="Help creators do their"
        highlight="best work."
        intro="We're a small team building a calmer, higher-quality marketplace for digital tools."
      />

      <section data-pop className="card mb-12 flex flex-col items-start gap-4 border-l-4 border-l-fuchsia-400 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">No open roles right now</h2>
          <p className="mt-1 text-muted">
            We&apos;re not hiring at the moment, but we always like meeting talented people. Introduce yourself and we&apos;ll keep you in mind.
          </p>
        </div>
        <Link href="/contact?topic=Other" className="btn-primary shrink-0">Say hello</Link>
      </section>

      <h2 className="mb-6 text-2xl font-semibold tracking-[-0.6px]">What working here is like</h2>
      <div data-stagger className="grid gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {PERKS.map((p) => (
          <div key={p.title} className="card group flex flex-col gap-3 p-6 transition duration-300 hover:-translate-y-1">
            <span className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br ${p.color} text-white shadow-md transition duration-500 group-hover:scale-110`}>
              <p.icon className="size-5" />
            </span>
            <h3 className="font-semibold">{p.title}</h3>
            <p className="text-sm leading-6 text-muted">{p.text}</p>
          </div>
        ))}
      </div>
      <p className="pb-16 text-sm text-muted">
        Prefer email? Write to <a className="font-medium text-brand" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
      </p>
    </div>
  );
}
