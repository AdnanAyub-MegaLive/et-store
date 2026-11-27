import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { cols } from "@/lib/db";
import { getAboutContent } from "@/lib/home-content";
import { ABOUT_COLORS, ABOUT_ICON_MAP } from "@/lib/about-icons";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = { title: "About", description: "Why ET-Store exists and what we care about." };
export const revalidate = 3600;

function CtaLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return href.startsWith("https://") ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
  ) : (
    <Link href={href} className={className}>{children}</Link>
  );
}

export default async function AboutPage() {
  const [c, products, categories] = await Promise.all([
    getAboutContent(),
    cols().then((c) => c.products.countDocuments({ published: true })),
    cols().then((c) => c.categories.countDocuments({ slug: { $ne: "unassigned" } })),
  ]);
  const stats = c.stats.items.map((s) => {
    const value = s.source === "products" ? products : s.source === "categories" ? categories : s.value;
    return { ...s, value, decimals: Number.isInteger(value) ? 0 : 1 };
  });
  const paragraphs = c.story.paragraphs.filter(Boolean);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <PageHero crumb="About" eyebrow={c.hero.eyebrow} title={c.hero.title} highlight={c.hero.highlight || undefined} intro={c.hero.intro || undefined} />

      {c.stats.enabled && stats.length > 0 && (
        <section data-stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="card p-6 text-center">
              <p className="text-gradient text-4xl font-bold tabular-nums" data-count={s.value} data-suffix={s.suffix} data-decimals={s.decimals}>
                {s.value.toLocaleString()}{s.suffix}
              </p>
              <p className="mt-2 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </section>
      )}

      {c.story.enabled && (
        <section className={`grid items-center gap-10 py-20 ${c.story.quote ? "lg:grid-cols-2" : ""}`}>
          <div data-slide="left" className="flex flex-col gap-4 leading-7 text-muted">
            <h2 className="text-3xl font-semibold tracking-[-0.75px] text-ink">{c.story.title}</h2>
            {paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
          </div>
          {c.story.quote && (
            <div data-slide="right" className="bg-gradient-brand relative overflow-hidden rounded-[18px] p-10 text-white shadow-[0_30px_60px_-30px_rgba(219,39,119,0.5)]">
              <div aria-hidden className="aurora-blob -right-16 -top-16 size-64 bg-amber-300/40" />
              <p className="relative text-2xl font-semibold leading-snug">“{c.story.quote}”</p>
              {c.story.quoteBy && <p className="relative mt-6 text-sm text-white/80">{c.story.quoteBy}</p>}
            </div>
          )}
        </section>
      )}

      {c.values.enabled && c.values.items.length > 0 && (
        <section className={`pb-20 ${c.story.enabled ? "" : "pt-20"}`}>
          <h2 className="mb-8 text-3xl font-semibold tracking-[-0.75px]">{c.values.title}</h2>
          <div data-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.values.items.map((v, i) => {
              const Icon = ABOUT_ICON_MAP[v.icon];
              return (
                <div key={i} className="card group flex flex-col gap-4 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-18px_rgba(103,48,204,0.45)]">
                  <span className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${ABOUT_COLORS[i % ABOUT_COLORS.length]} text-white shadow-md transition duration-500 group-hover:rotate-[-8deg] group-hover:scale-110`}>
                    <Icon className="size-6" />
                  </span>
                  <h3 className="text-lg font-semibold">{v.title}</h3>
                  <p className="text-sm leading-6 text-muted">{v.text}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {c.cta.enabled && (
        <section data-pop className="mb-16 flex flex-col items-center gap-4 rounded-[18px] bg-surface p-10 text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.75px]">{c.cta.title}</h2>
          {c.cta.text && <p className="max-w-lg text-muted">{c.cta.text}</p>}
          <div className="flex flex-wrap justify-center gap-3">
            {c.cta.primaryLabel && c.cta.primaryHref && (
              <CtaLink href={c.cta.primaryHref} className="btn-primary group">{c.cta.primaryLabel} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></CtaLink>
            )}
            {c.cta.secondaryLabel && c.cta.secondaryHref && <CtaLink href={c.cta.secondaryHref} className="btn-outline">{c.cta.secondaryLabel}</CtaLink>}
          </div>
        </section>
      )}
    </div>
  );
}
