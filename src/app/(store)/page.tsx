import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Download, Gift, Quote, ShieldCheck } from "lucide-react";
import { categoriesWithCounts, cols, withCategories } from "@/lib/db";
import { HowItWorks } from "@/components/how-it-works";
import { ProductCard } from "@/components/product-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { accentFor, iconFor } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { getHomeContent } from "@/lib/home-content";

export const revalidate = 300;



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
  const [content, rawCategories, trending] = await Promise.all([
    getHomeContent(),
    categoriesWithCounts({ publishedOnly: true, hideSlug: "unassigned" }),
    cols().then(async ({ products }) => withCategories(await products.find({ published: true }).sort({ featured: -1, reviewCount: -1 }).limit(4).toArray())),
  ]);
  const categories = rawCategories;
  const { hero, clients, promo, testimonials, newsletter } = content;
  const POINT_ICONS = [
    <Download key="d" className="size-4 text-cyan-500" />,
    <ShieldCheck key="s" className="size-4 text-emerald-500" />,
    <BadgeCheck key="b" className="size-4 text-pink-500" />,
  ];

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col px-4 pb-16 sm:px-6">
      {/* Hero */}
      <section className="grid w-full items-center gap-12 py-16 lg:grid-cols-2 lg:py-20">
        <div className="flex flex-col items-start gap-6">
          {hero.badge && (
          <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft/60 px-3 py-1 text-xs font-semibold tracking-[1.4px] text-brand">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-brand" />
            </span>
            {hero.badge}
          </p>
          )}
          <h1 className="max-w-[576px] text-4xl font-semibold leading-[1.15] tracking-[-1.2px] [perspective:600px] sm:text-5xl sm:leading-[60px]">
            <span data-split>{hero.title}</span>{" "}
            {hero.highlight && <span className="text-gradient animate-fade-up inline-block [animation-delay:500ms]">{hero.highlight}</span>}
          </h1>
          <p className="animate-fade-up max-w-[512px] text-lg leading-8 text-muted [animation-delay:160ms]">
            {hero.subtitle}
          </p>
          <div className="animate-fade-up flex flex-wrap gap-3 [animation-delay:240ms]">
            <Link href={hero.primaryHref} className="btn-primary group">
              {hero.primaryLabel} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            {hero.secondaryLabel && hero.secondaryHref && (hero.secondaryHref.startsWith("https://") ? (
              <a href={hero.secondaryHref} target="_blank" rel="noopener noreferrer" className="btn-outline group">
                <Download className="size-4 transition-transform group-hover:translate-y-0.5" />{hero.secondaryLabel}
              </a>
            ) : (
              <Link href={hero.secondaryHref} className="btn-outline">{hero.secondaryLabel}</Link>
            ))}
          </div>
          <ul className="animate-fade-up flex flex-wrap gap-6 pt-4 text-sm text-muted [animation-delay:320ms]">
            {hero.points.filter(Boolean).map((pt, i) => (
              <li key={i} className="flex items-center gap-2">{POINT_ICONS[i % POINT_ICONS.length]}{pt}</li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-up bg-gradient-brand group relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[18px] px-10 py-12 shadow-[0_30px_60px_-30px_rgba(103,48,204,0.6)] [animation-delay:200ms]">
          <div className="absolute inset-8 rounded-[18px] bg-[#10101c]/90" />
          <div aria-hidden className="animate-glow absolute left-[35%] top-[40%] size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/50 blur-3xl" />
          <div aria-hidden className="animate-glow absolute left-[65%] top-[60%] size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/40 blur-3xl [animation-delay:-3s]" />
          <div data-parallax="-0.12" className="relative">
            <div className="animate-float-tilt relative h-80 w-64 overflow-hidden rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
              <Image src={hero.image} alt="ET-Store virtual items preview" fill priority sizes="256px" unoptimized={hero.image.endsWith(".svg") || !hero.image.startsWith("/")} className="object-cover transition duration-700 group-hover:scale-105" />
            </div>
          </div>
          {hero.statLabel && (
          <div className="animate-float absolute right-8 top-8 rounded-xl border border-white/20 bg-panel px-4 py-3 shadow-lg [animation-delay:1s]">
            <p className="text-lg font-semibold tabular-nums" data-count={hero.statValue} data-suffix={hero.statSuffix}>{hero.statValue >= 1000 ? `${Math.round(hero.statValue / 1000)}k` : hero.statValue}{hero.statSuffix}</p>
            <p className="text-xs text-muted">{hero.statLabel}</p>
          </div>
          )}
        </div>
      </section>

      {/* Endless client logo strip */}
      {clients.enabled && clients.items.length > 0 && (
      <section aria-label="Our clients" className="relative -mx-4 overflow-hidden border-y border-line bg-panel/60 py-5 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)] sm:-mx-6">
        <p className="sr-only">Trusted by {clients.items.map((c) => c.name).join(", ")}</p>
        <div data-marquee className="flex w-max items-center gap-16" aria-hidden>
          {[...clients.items, ...clients.items, ...clients.items, ...clients.items].map((c, i) => (
            <Image
              key={i}
              src={c.logo}
              alt=""
              width={150}
              height={40}
              unoptimized
              loading="eager"
              className="h-9 w-auto opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 dark:brightness-150"
            />
          ))}
        </div>
      </section>
      )}

      {/* Categories */}
      <section id="categories" className="flex w-full scroll-mt-20 flex-col gap-6 py-12">
        <Reveal><SectionHead title={content.categories.title} href="/shop" link="View all" /></Reveal>
        <div data-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const Icon = iconFor(c.icon);
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
        <Reveal><SectionHead title={content.trending.title} href="/shop" link="See all products" /></Reveal>
        <div data-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* Promo */}
      {promo.enabled && (
      <Reveal>
        <section className="bg-gradient-brand group relative flex w-full flex-col items-start justify-between gap-6 overflow-hidden rounded-[18px] p-10 shadow-[0_30px_60px_-30px_rgba(219,39,119,0.5)] sm:flex-row sm:items-center">
          <div aria-hidden data-parallax="0.5" className="absolute -right-20 -top-20 size-64 rounded-full bg-amber-300/40 blur-2xl" />
          <div aria-hidden data-parallax="-0.4" className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-cyan-300/30 blur-2xl" />
          {promo.tag && <span aria-hidden data-pop="0.3" className="absolute right-[38%] top-6 hidden rotate-12 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-ink shadow-lg sm:block">{promo.tag}</span>}
          <div className="relative flex flex-col gap-2">
            <h2 className="text-3xl font-semibold text-on-brand">{promo.title}</h2>
            {promo.text && <p className="text-on-brand/80">{promo.text}</p>}
          </div>
          <Link href={promo.buttonHref} className="btn relative bg-panel text-ink shadow-sm hover:-translate-y-0.5 hover:shadow-lg">
            <Gift className="size-4 text-brand" />{promo.buttonLabel}
          </Link>
        </section>
      </Reveal>
      )}

      {/* How it works: sticky, spring-smoothed scroll walkthrough */}
      <HowItWorks content={content.howItWorks} />

      {/* Testimonials */}
      {testimonials.enabled && testimonials.items.length > 0 && (
      <section id="resources" className="flex w-full flex-col gap-6 pb-28 pt-24">
        <Reveal><SectionHead title={testimonials.title} /></Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.items.map((t, i) => (
            <Reveal key={i} delay={i * 100} className="h-full">
              <figure className="card flex h-full flex-col justify-between gap-5 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-20px_rgba(16,16,28,0.3)]">
                <div>
                  <Quote className="mb-3 size-5 text-brand/40" />
                  <blockquote className="leading-7 text-muted">“{t.quote}”</blockquote>
                </div>
                <figcaption className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-brand-soft font-semibold text-[#292149] dark:text-violet-200">
                    {t.name.split(/s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{t.name}</span>
                    {t.role && <span className="block text-xs text-muted">{t.role}</span>}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>
      )}

      {/* Newsletter */}
      <Reveal>
        <section className="flex w-full flex-col items-center gap-3 rounded-[18px] bg-surface p-10 text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.75px]">{newsletter.title}</h2>
          {newsletter.text && <p className="max-w-[512px] pb-3 text-muted">{newsletter.text}</p>}
          <NewsletterForm large />
        </section>
      </Reveal>
    </div>
  );
}
