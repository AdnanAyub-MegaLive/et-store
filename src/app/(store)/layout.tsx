import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FavoritesProvider } from "@/components/favorites-context";
import { getCurrentUser } from "@/lib/session";
import { cols } from "@/lib/db";
import { CopyProtection } from "@/components/copy-protection";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const favorites = user ? (await (await cols()).favorites.find({ userId: user.id }, { projection: { productId: 1 } }).toArray()).map((f) => f.productId) : [];
  return (
    <FavoritesProvider key={user?.id ?? "guest"} initial={favorites}>
      <CopyProtection />
      <SiteHeader />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter />
    </FavoritesProvider>
  );
}
