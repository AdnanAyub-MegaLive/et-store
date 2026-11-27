import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { Check, ChevronRight, Download, RefreshCw, ShieldCheck, Star } from "lucide-react";
import { cols, withCategories } from "@/lib/db";
import { money } from "@/lib/format";
import { BuyButtons } from "./buy-buttons";
import { accentFor } from "@/components/icons";
import { ProductGallery } from "@/components/product-gallery";
import { MotionPreview } from "@/components/motion-preview";
import { ProductVideo } from "@/components/product-video";

const FEATURE_COLORS = ["from-violet-500 to-indigo-500", "from-pink-500 to-rose-500", "from-cyan-400 to-sky-500", "from-emerald-400 to-teal-500", "from-amber-400 to-orange-500", "from-fuchsia-500 to-purple-500"];

const getProduct = cache(async (slug: string) => {
  const doc = await (await cols()).products.findOne({ slug, published: true });
  return doc ? (await withCategories([doc]))[0] : null;
});

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  return p ? { title: p.name, description: p.tagline } : {};
}

export default async function ProductPage({ params, searchParams }: P & { searchParams: Promise<{ tab?: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const tab = (await searchParams).tab ?? "overview";
  const related = (
    await (await cols()).products
      .find({ published: true, _id: { $ne: p.id } }, { projection: { slug: 1, name: 1, image: 1, priceCents: 1 } })
      .sort({ reviewCount: -1 })
      .limit(4)
      .toArray()
  ).map(({ _id, ...r }) => ({ id: _id, ...r }));
  const off = p.compareCents ? Math.round((1 - p.priceCents / p.compareCents) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <nav className="flex items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/">Home</Link><ChevronRight className="size-3" />
        <Link href={`/shop?category=${p.category.slug}`}>{p.category.name}</Link><ChevronRight className="size-3" />
        <span className="text-ink">{p.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div data-slide="left">
          {p.video ? (
            <ProductVideo src={p.video} name={p.name} images={[p.image, ...p.gallery]} />
          ) : p.partnerId && p.partnerMotion && !p.gallery.length ? (
            <MotionPreview src={`/partner-media/${encodeURIComponent(p.partnerId)}/motion`} poster={p.image} name={p.name} />
          ) : (
            <ProductGallery name={p.name} images={[p.image, ...p.gallery]} />
          )}
        </div>

        <div data-slide="right" className="flex flex-col gap-5">
          <p className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[1.4px] ${accentFor(p.category.slug).tint} ${accentFor(p.category.slug).text}`}>{p.category.name}</p>
          <h1 data-split className="text-3xl font-semibold tracking-[-0.75px] sm:text-4xl">{p.name}</h1>
          <p className="flex items-center gap-2 text-sm text-muted">
            <Star className="size-4 fill-amber-400 text-amber-400" /><span className="font-medium text-ink">{p.rating.toFixed(1)}</span> {p.reviewCount} reviews
          </p>
          <p className="flex items-center gap-3">
            <span className="text-gradient text-4xl font-bold tabular-nums" data-count={(p.priceCents / 100).toFixed(2)} data-prefix="$" data-decimals="2">{money(p.priceCents)}</span>
            {p.compareCents && <span className="text-muted line-through">{money(p.compareCents)}</span>}
            {off > 0 && <span data-pop="0.6" className="rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-1 text-xs font-bold text-white shadow">{off}% off</span>}
          </p>
          <p className="leading-7 text-muted">{p.tagline}</p>
          <BuyButtons id={p.id} />
          <ul className="flex flex-wrap gap-6 border-t border-line pt-6 text-sm text-muted">
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-500" />Commercial license</li>
            <li className="flex items-center gap-2"><Download className="size-4 text-cyan-500" />Instant download</li>
            <li className="flex items-center gap-2"><RefreshCw className="size-4 text-pink-500" />Lifetime updates</li>
          </ul>
        </div>
      </div>

      <div className="mt-14 grid grid-cols-3 border-b border-line text-center text-sm">
        {[["overview", "Overview"], ["included", "What's included"], ["license", "License"]].map(([k, l]) => (
          <Link key={k} href={`?tab=${k}`} scroll={false} className={`relative py-3 transition-colors ${tab === k ? "font-medium text-brand" : "text-muted hover:text-ink"}`}>
            {l}
            <span aria-hidden className={`absolute inset-x-0 -bottom-px h-0.5 bg-brand transition-transform duration-300 ${tab === k ? "scale-x-100" : "scale-x-0"}`} />
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          {tab === "license" ? (
            <p className="leading-7 text-muted">Commercial license: use in unlimited personal and client projects. Redistribution or resale of the source files is not permitted.</p>
          ) : (
            <>
              <h2 className="text-2xl font-semibold">Everything you need to ship beautifully</h2>
              <p className="mt-4 leading-7 text-muted">{p.description}</p>
              <ul data-stagger className="mt-6 grid gap-4 sm:grid-cols-2">
                {p.features.map((f, i) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <span className={`grid size-6 place-items-center rounded-full bg-gradient-to-br text-white ${FEATURE_COLORS[i % FEATURE_COLORS.length]}`}><Check className="size-3.5" /></span>
                    {f}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <aside data-slide="right" className="card h-fit border-t-4 border-t-fuchsia-400 p-6 text-sm">
          <h2 className="mb-4 text-lg font-semibold">Product info</h2>
          {[["Creator", p.creator], ["File types", p.fileTypes], ["File size", p.fileSize], ["Last update", p.updatedAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })]].map(([k, v]) => (
            <p key={k} className="flex justify-between gap-4 whitespace-nowrap py-2"><span className="text-muted">{k}</span><span>{v}</span></p>
          ))}
        </aside>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">Related products</h2>
        <div data-stagger className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((r) => (
            <Link key={r.id} href={`/products/${r.slug}`} className="group card overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-20px_rgba(103,48,204,0.45)]">
              <div className="relative h-36 overflow-hidden"><Image src={r.image} alt={r.name} fill sizes="25vw" className="object-cover transition duration-700 group-hover:scale-105" /></div>
              <div className="p-4"><p className="font-medium transition-colors group-hover:text-brand">{r.name}</p><p className="text-sm text-muted">{money(r.priceCents, 0)}</p></div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
