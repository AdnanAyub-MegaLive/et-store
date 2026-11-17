import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, Heart, Sparkles, Users } from "lucide-react";
import { db } from "@/lib/db";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = { title: "About", description: "Why ET-Store exists and how we curate digital tools for creators." };
export const revalidate = 3600;

const VALUES = [
  { icon: BadgeCheck, title: "Curated, not crowded", text: "Every product is reviewed by a person before it goes live. Fewer choices, all of them good.", color: "from-violet-500 to-indigo-500" },
  { icon: Heart, title: "Fair to creators", text: "Makers keep the majority of every sale and get paid out on a predictable schedule.", color: "from-pink-500 to-rose-500" },
  { icon: Sparkles, title: "Built to be used", text: "Clear licences, instant downloads and lifetime updates, so buying is the easy part.", color: "from-amber-400 to-orange-500" },
  { icon: Users, title: "Made with the community", text: "Our roadmap comes from the buyers and makers who use ET-Store every day.", color: "from-cyan-400 to-emerald-400" },
];

export default async function AboutPage() {
  const [products, categories] = await Promise.all([db.product.count({ where: { published: true } }), db.category.count()]);
  const stats = [
    { value: 12000, suffix: "+", label: "Creators" },
    { value: products, suffix: "", label: "Curated products" },
    { value: categories, suffix: "", label: "Categories" },
    { value: 4.8, suffix: "", label: "Average rating", decimals: 1 },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <PageHero
        crumb="About"
        eyebrow="OUR STORY"
        title="Tools that help good work"
        highlight="stand out."
        intro="ET-Store started with a simple frustration: finding a great template took longer than using it. So we built a small, carefully edited marketplace where every product earns its place."
      />

      <section data-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-6 text-center">
            <p className="text-gradient text-4xl font-bold tabular-nums" data-count={s.value} data-suffix={s.suffix} data-decimals={s.decimals}>
              {s.value.toLocaleString()}{s.suffix}
            </p>
            <p className="mt-2 text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="grid items-center gap-10 py-20 lg:grid-cols-2">
        <div data-slide="left" className="flex flex-col gap-4 leading-7 text-muted">
          <h2 className="text-3xl font-semibold tracking-[-0.75px] text-ink">Why we exist</h2>
          <p>
            Independent designers, writers and founders make some of the best work on the internet, but it often gets buried in
            marketplaces built for volume. We wanted the opposite: a place where quality is the filter and every listing is
            something we would buy ourselves.
          </p>
          <p>
            Today ET-Store brings together templates, UI kits, guides, graphics, AI prompts and business tools from makers
            around the world, with simple licensing and instant access after checkout.
          </p>
        </div>
        <div data-slide="right" className="bg-gradient-brand relative overflow-hidden rounded-[18px] p-10 text-white shadow-[0_30px_60px_-30px_rgba(219,39,119,0.5)]">
          <div aria-hidden className="aurora-blob -right-16 -top-16 size-64 bg-amber-300/40" />
          <p className="relative text-2xl font-semibold leading-snug">
            “Our job is to save you the hours of searching, so you can spend them on the work only you can do.”
          </p>
          <p className="relative mt-6 text-sm text-white/80">The ET-Store team</p>
        </div>
      </section>

      <section className="pb-20">
        <h2 className="mb-8 text-3xl font-semibold tracking-[-0.75px]">What we care about</h2>
        <div data-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="card group flex flex-col gap-4 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-18px_rgba(103,48,204,0.45)]">
              <span className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${v.color} text-white shadow-md transition duration-500 group-hover:rotate-[-8deg] group-hover:scale-110`}>
                <v.icon className="size-6" />
              </span>
              <h3 className="text-lg font-semibold">{v.title}</h3>
              <p className="text-sm leading-6 text-muted">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section data-pop className="mb-16 flex flex-col items-center gap-4 rounded-[18px] bg-surface p-10 text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.75px]">Find your next favourite tool</h2>
        <p className="max-w-lg text-muted">Browse the full collection, or get in touch if you&apos;d like to sell your work on ET-Store.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-primary group">Explore products <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
          <Link href="/contact" className="btn-outline">Contact us</Link>
        </div>
      </section>
    </div>
  );
}
