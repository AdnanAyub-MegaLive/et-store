import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { money } from "@/lib/format";
import { FavoriteButton } from "./favorite-button";

export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  compareCents: number | null;
  badge: string | null;
  rating: number;
  reviewCount: number;
  category: { name: string };
};

const BADGE_COLORS: Record<string, string> = {
  new: "from-emerald-500 to-teal-500",
  popular: "from-pink-500 to-rose-500",
  "best seller": "from-amber-400 to-orange-500",
  bestseller: "from-amber-400 to-orange-500",
  featured: "from-violet-600 to-fuchsia-500",
};
const badgeColor = (b: string) => BADGE_COLORS[b.toLowerCase()] ?? BADGE_COLORS.featured;

export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} style={{ width: size, height: size }} className={i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-line"} />
      ))}
    </span>
  );
}

export function ProductCard({ p, showCount = false, priority = false }: { p: CardProduct; showCount?: boolean; priority?: boolean }) {
  return (
    <article className="group card relative flex h-full flex-col overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition duration-300 ease-out hover:-translate-y-1.5 hover:border-brand/30 hover:shadow-[0_22px_40px_-20px_rgba(103,48,204,0.45)]">
      <div className="relative h-56 overflow-hidden bg-surface">
        <Image src={p.image} alt={p.name} fill sizes="(max-width:768px) 100vw, 25vw" className="object-cover transition duration-700 ease-out group-hover:scale-[1.07]" priority={priority} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        {p.badge && <span className={`absolute left-3 top-3 rounded-[9px] bg-gradient-to-r px-2 py-1 text-xs font-semibold text-white shadow-md ${badgeColor(p.badge)}`}>{p.badge}</span>}
        <span aria-hidden className="absolute bottom-3 left-3 translate-y-3 rounded-lg bg-panel/95 px-3 py-1.5 text-xs font-medium text-ink opacity-0 shadow transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          View details →
        </span>
        <FavoriteButton productId={p.id} name={p.name} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs text-muted">{p.category.name}</p>
        <h3 className="font-medium transition-colors group-hover:text-brand">
          <Link href={`/products/${p.slug}`} className="after:absolute after:inset-0">
            {p.name}
          </Link>
        </h3>
        <div className="flex items-center gap-1 text-sm text-muted">
          <Stars rating={p.rating} />
          <span className="pl-1">
            {p.rating.toFixed(1)}
            {showCount && ` (${p.reviewCount})`}
          </span>
        </div>
        <p className="mt-auto font-semibold">
          {money(p.priceCents, 0)}
          {p.compareCents && <span className="ml-1 text-sm font-normal text-muted line-through">{money(p.compareCents, 0)}</span>}
        </p>
      </div>
    </article>
  );
}
