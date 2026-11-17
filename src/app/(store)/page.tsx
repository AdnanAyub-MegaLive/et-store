import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Download, Gift, Quote, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { HowItWorks } from "@/components/how-it-works";
import { ProductCard } from "@/components/product-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { accentFor, categoryIcons } from "@/components/icons";
import { Reveal } from "@/components/reveal";

export const revalidate = 300;

// Matches the order in the Figma design.
const CATEGORY_ORDER = ["templates", "ui-kits", "ebooks-guides", "graphics", "ai-prompts", "business-tools"];

const testimonials = [
  { q: "ET-Store has become my go-to place for polished assets that make every client project feel more considered.", n: "Alex Morgan", r: "Brand designer" },
  { q: "The quality is exceptional and the instant downloads keep my small team moving without slowing down.", n: "Jordan Reed", r: "Founder, Northstar" },
  { q: "I find something useful every time I visit. It feels like a carefully edited library, not another noisy marketplace.", n: "Sam Kim", r: "Creative consultant" },
];

const SectionHead = ({ title, href, link }: { title: string; href?: string; link?: string }) => (
  <div className="flex items-end justify-between">
    <h2 className="relative text-2xl font-semibold tracking-[-0.6px]">
      {title}
      <span aria-hidden className="bg-gradient-brand absolute -bottom-1.5 left-0 h-1 w-10 rounded-full" />
    </h2>
    {href && (
      <Link href={href} className="group inline-flex items-center gap-1 text-sm font-medium text-brand">
        {link}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
      </Link>
    )}
  </div>
);

export default async function Home() {
  const [rawCategories, trending] = await Promise.all([
    db.category.findMany({ include: { _count: { select: { products: { where: { published: true } } } } } }),
    db.product.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { reviewCount: "desc" }],
      take: 4,
      include: { category: { select: { name: true } } },
    }),
  ]);
  const rank = (slug: string) => (CATEGORY_ORDER.indexOf(slug) + 1 || 99);
  const categories = rawCategories.sort((a, b) => rank(a.slug) - rank(b.slug));

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col px-4 pb-16 sm:px-6">
      {/* Hero */}
      <section className="grid w-full items-center gap-12 py-16 lg:grid-cols-2 lg:py-20">
        <div className="flex flex-col items-start gap-6">
          <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft/60 px-3 py-1 text-xs font-semibold tracking-[1.4px] text-brand">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-brand" />
            </span>
            THE CREATOR&apos;S MARKETPLACE
          </p>
          <h1 className="max-w-[576px] text-4xl font-semibold leading-[1.15] tracking-[-1.2px] [perspective:600px] sm:text-5xl sm:leading-[60px]">
            <span data-split>Digital tools for work that</span>{" "}
            <span className="text-gradient animate-fade-up inline-block [animation-delay:500ms]">stands out.</span>
          </h1>
          <p className="animate-fade-up max-w-[512px] text-lg leading-8 text-muted [animation-delay:160ms]">
            Curated templates, systems, and resources that help you move from idea to done, faster.
          </p>
          <div className="animate-fade-up flex flex-wrap gap-3 [animation-delay:240ms]">
            <Link href="/shop" className="btn-primary group">
              Explore products <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="#categories" className="btn-outline">Browse categories</Link>
          </div>
          <ul className="animate-fade-up flex flex-wrap gap-6 pt-4 text-sm text-muted [animation-delay:320ms]">
            <li className="flex items-center gap-2"><Download className="size-4 text-cyan-500" />Instant download</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-500" />Commercial license</li>
            <li className="flex items-center gap-2"><BadgeCheck className="size-4 text-pink-500" />Curated quality</li>
          </ul>
        </div>

        <div className="animate-fade-up bg-gradient-brand group relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[18px] px-10 py-12 shadow-[0_30px_60px_-30px_rgba(103,48,204,0.6)] [animation-delay:200ms]">
          <div className="absolute inset-8 rounded-[18px] bg-[#10101c]/90" />
          <div aria-hidden className="animate-glow absolute left-[35%] top-[40%] size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/50 blur-3xl" />
          <div aria-hidden className="animate-glow absolute left-[65%] top-[60%] size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/40 blur-3xl [animation-delay:-3s]" />
          <div data-parallax="-0.12" className="relative">
            <div className="animate-float-tilt relative h-80 w-64 overflow-hidden rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
              <Image src="/products/nova-ui-kit.png" alt="Nova digital product mockup" fill priority sizes="256px" className="object-cover transition duration-700 group-hover:scale-105" />
            </div>
          </div>
          <div className="animate-float absolute right-8 top-8 rounded-xl border border-white/20 bg-panel px-4 py-3 shadow-lg [animation-delay:1s]">
            <p className="text-lg font-semibold tabular-nums" data-count="12000" data-suffix="+">12k+</p>
            <p className="text-xs text-muted">creators</p>
          </div>
          <div className="animate-float absolute bottom-10 left-10 hidden items-center gap-2 rounded-xl bg-panel/95 px-3 py-2 text-xs font-medium shadow-lg sm:flex [animation-delay:2.5s]">
            <span className="grid size-5 place-items-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 text-white"><Download className="size-3" /></span> Instant access
          </div>
        </div>
      </section>

      {/* Endless category strip */}
      <div className="relative -mx-4 overflow-hidden border-y border-line bg-panel/60 py-4 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)] sm:-mx-6" aria-hidden>
        <div data-marquee className="flex w-max gap-10">
          {[...categories, ...categories, ...categories, ...categories].map((c, i) => {
            const Icon = categoryIcons[c.icon] ?? categoryIcons["layout-template"];
            return (
              <span key={i} className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-muted">
                <Icon className={`size-4 ${accentFor(c.slug).text}`} />
                {c.name}
                <span className="ml-8 text-brand/40">✦</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      <section id="categories" className="flex w-full scroll-mt-20 flex-col gap-6 py-12">
        <Reveal><SectionHead title="Shop by category" href="/shop" link="View all" /></Reveal>
        <div data-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const Icon = categoryIcons[c.icon] ?? categoryIcons["layout-template"];
            const a = accentFor(c.slug);
            return (
              <div key={c.id}>
                <Link
                  href={`/shop?category=${c.slug}`}
                  className={`group flex h-[86px] items-center gap-4 rounded-[18px] border border-line ${a.tint} p-5 transition duration-300 hover:-translate-y-1 hover:border-transparent hover:bg-panel hover:shadow-[0_18px_34px_-18px_rgba(103,48,204,0.45)]`}
                >
                  <span className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br ${a.tile} text-white shadow-md transition duration-500 group-hover:rotate-[-8deg] group-hover:scale-110`}>
                    <Icon className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted">{c._count.products.toLocaleString()} products</p>
                  </div>
                  <ChevronRight className={`size-4 text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink`} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trending */}
      <section className="flex w-full flex-col gap-6 pb-24 pt-12">
        <Reveal><SectionHead title="Trending this week" href="/shop" link="See all products" /></Reveal>
        <div data-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* Promo */}
      <Reveal>
        <section className="bg-gradient-brand group relative flex w-full flex-col items-start justify-between gap-6 overflow-hidden rounded-[18px] p-10 shadow-[0_30px_60px_-30px_rgba(219,39,119,0.5)] sm:flex-row sm:items-center">
          <div aria-hidden data-parallax="0.5" className="absolute -right-20 -top-20 size-64 rounded-full bg-amber-300/40 blur-2xl" />
          <div aria-hidden data-parallax="-0.4" className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-cyan-300/30 blur-2xl" />
          <span aria-hidden data-pop="0.3" className="absolute right-[38%] top-6 hidden rotate-12 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-ink shadow-lg sm:block">−25%</span>
          <div className="relative flex flex-col gap-2">
            <h2 className="text-3xl font-semibold text-on-brand">Build your next big thing for less</h2>
            <p className="text-on-brand/80">Save 25% on curated bundles this week.</p>
          </div>
          <Link href="/shop" className="btn relative bg-panel text-ink shadow-sm hover:-translate-y-0.5 hover:shadow-lg">
            <Gift className="size-4 text-brand" />Shop bundles
          </Link>
        </section>
      </Reveal>

      {/* How it works: sticky, spring-smoothed scroll walkthrough */}
      <HowItWorks />

      {/* Testimonials */}
      <section id="resources" className="flex w-full flex-col gap-6 pb-28 pt-24">
        <Reveal><SectionHead title="Loved by independent makers" /></Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.n} delay={i * 100} className="h-full">
              <figure className="card flex h-full flex-col justify-between gap-5 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-20px_rgba(16,16,28,0.3)]">
                <div>
                  <Quote className="mb-3 size-5 text-brand/40" />
                  <blockquote className="leading-7 text-muted">“{t.q}”</blockquote>
                </div>
                <figcaption className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-brand-soft font-semibold text-[#292149] dark:text-violet-200">
                    {t.n.split(" ").map((w) => w[0]).join("")}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{t.n}</span>
                    <span className="block text-xs text-muted">{t.r}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <Reveal>
        <section className="flex w-full flex-col items-center gap-3 rounded-[18px] bg-surface p-10 text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.75px]">Fresh assets, zero noise</h2>
          <p className="max-w-[512px] pb-3 text-muted">A thoughtful digest of new digital products, practical resources, and marketplace news.</p>
          <NewsletterForm large />
        </section>
      </Reveal>
    </div>
  );
}
