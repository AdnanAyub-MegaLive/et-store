import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { cols, withCategories } from "@/lib/db";
import { PageHero } from "@/components/page-hero";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = { title: "Favorites", robots: { index: false } };

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  const favorites = user
    ? await (async () => {
        const { favorites, products } = await cols();
        const favs = await favorites.find({ userId: user.id }).sort({ createdAt: -1 }).toArray();
        const prods = new Map((await withCategories(await products.find({ _id: { $in: favs.map((f) => f.productId) }, published: true }).toArray())).map((p) => [p.id, p]));
        return favs.flatMap(({ _id, ...f }) => {
          const product = prods.get(f.productId);
          return product ? [{ ...f, id: _id, product }] : [];
        });
      })()
    : [];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <PageHero crumb="Favorites" eyebrow="SAVED FOR LATER" title="Your" highlight="favorites" intro="Tap the heart on any item to save it here." />

      {!user ? (
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-pink-50 text-pink-500 dark:bg-pink-500/15"><Heart className="size-6" /></span>
          <h2 className="text-xl font-semibold">Sign in to see your favorites</h2>
          <p className="max-w-md text-muted">Your saved items are kept in your account, so you can see them on any device.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/login?next=%2Ffavorites" className="btn-primary">Sign in</Link>
            <Link href="/register" className="btn-outline">Create account</Link>
          </div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-pink-50 text-pink-500 dark:bg-pink-500/15"><Heart className="size-6" /></span>
          <h2 className="text-xl font-semibold">No favorites yet</h2>
          <p className="max-w-md text-muted">Tap the heart on any item to save it here.</p>
          <Link href="/shop" className="btn-primary">Browse products</Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">{favorites.length} saved item{favorites.length === 1 ? "" : "s"}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((f) => <ProductCard key={f.productId} p={f.product} />)}
          </div>
        </>
      )}
    </div>
  );
}
