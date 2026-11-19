import Link from "next/link";
import { Heart, ShoppingBag, User } from "lucide-react";
import { SearchDialog } from "./search-dialog";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { CartCount } from "./cart";
import { FavoritesCount } from "./favorites-context";
import { NavLinks } from "./nav-links";
import { HeaderShell } from "./header-shell";
import { ThemeToggle } from "./theme-toggle";
import { getHeaderContent } from "@/lib/home-content";
import { iconFor } from "./icons";

const iconBtn = "relative grid size-9 place-items-center rounded-xl transition hover:bg-surface hover:text-brand active:scale-90";

/** The "ET" brand mark. Used in the header, admin sidebar and sign-in panel. */
export function LogoMark({ className = "size-8 text-[13px]", mark = "ET" }: { className?: string; mark?: string }) {
  return (
    <span
      aria-hidden
      className={`bg-gradient-brand grid shrink-0 place-items-center rounded-xl font-extrabold tracking-[-0.5px] text-white shadow-[0_6px_16px_-6px_rgba(219,39,119,0.6)] ${className}`}
    >
      {mark}
    </span>
  );
}

/** Site logo: an uploaded image, or the gradient mark + text. Edited in admin → Header. */
export async function Logo() {
  const { logo } = await getHeaderContent();
  const name = `${logo.text}${logo.highlight}`.trim() || "Home";
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label={`${name} home`}>
      {logo.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded logo of unknown size/type (SVG allowed)
        <img src={logo.image} alt={name} className="h-9 w-auto max-w-[180px] object-contain transition duration-300 group-hover:scale-105" />
      ) : (
        <>
          {logo.mark && (
            <span className="transition duration-300 group-hover:rotate-[-8deg] group-hover:scale-110">
              <LogoMark mark={logo.mark} />
            </span>
          )}
          <span className="text-lg font-semibold tracking-[-0.45px]">
            {logo.text}
            {logo.highlight && <span className="text-gradient">{logo.highlight}</span>}
          </span>
        </>
      )}
    </Link>
  );
}

export async function SiteHeader() {
  const [user, categories, header] = await Promise.all([
    getCurrentUser(),
    db.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], select: { slug: true, name: true, icon: true } }),
    getHeaderContent(),
  ]);
  const { icons } = header;
  const accountHref = user ? (user.role === "ADMIN" ? "/admin" : "/account") : "/login";
  return (
    <HeaderShell>
      <nav className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:gap-8" aria-label="Primary navigation">
        <Logo />
        {/* Categories now live in the sub-header below, so dropdown links are hidden here. */}
        <NavLinks links={header.links.filter((l) => !l.dropdown)} categories={[]} />
        <div className="ml-auto flex items-center gap-1">
          {icons.search && <SearchDialog className={iconBtn} />}
          {icons.favorites && (
            <Link href="/favorites" className={iconBtn} aria-label="Favorites" title="Favorites">
              <Heart className="size-5" />
              <FavoritesCount />
            </Link>
          )}
          {icons.cart && (
            <Link href="/cart" className={iconBtn} aria-label="Shopping bag">
              <ShoppingBag className="size-5" />
              <CartCount />
            </Link>
          )}
          <Link href={accountHref} className={`${iconBtn} ${user ? "bg-brand-soft" : ""}`} aria-label={user ? "Account" : "Log in"} title={user ? "Account" : "Log in"}>
            <User className="size-5" />
          </Link>
          {icons.theme && <ThemeToggle />}
        </div>
      </nav>
      {categories.length > 0 && (
        <div className="border-t border-line/70">
          <ul className="no-scrollbar mx-auto flex h-11 max-w-[1280px] items-center gap-1 overflow-x-auto px-4 text-sm sm:px-6 xl:justify-between" aria-label="Categories">
            {categories.map((c) => {
              const Icon = iconFor(c.icon);
              return (
                <li key={c.slug} className="shrink-0">
                  <Link href={`/shop?category=${c.slug}`} className="group flex items-center gap-1.5 rounded-lg py-1.5 font-semibold px-3 xl:px-2 text-muted transition hover:bg-brand-soft hover:text-brand">
                    <Icon className="size-4 text-violet-500 transition group-hover:text-pink-500" />
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </HeaderShell>
  );
}
