import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FavoritesProvider } from "@/components/favorites-context";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const favorites = user ? (await db.favorite.findMany({ where: { userId: user.id }, select: { productId: true } })).map((f) => f.productId) : [];
  return (
    <FavoritesProvider key={user?.id ?? "guest"} initial={favorites}>
      <SiteHeader />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter />
    </FavoritesProvider>
  );
}
