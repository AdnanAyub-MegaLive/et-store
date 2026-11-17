import Link from "next/link";
import { Heart, ShoppingBag, User } from "lucide-react";
import { SearchDialog } from "./search-dialog";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { sortCategories } from "./icons";
import { CartCount } from "./cart";
import { NavLinks } from "./nav-links";
import { HeaderShell } from "./header-shell";
import { ThemeToggle } from "./theme-toggle";

const iconBtn = "relative grid size-9 place-items-center rounded-xl transition hover:bg-surface hover:text-brand active:scale-90";

/** The "ET" brand mark. Used in the header, admin sidebar and sign-in panel. */
export function LogoMark({ className = "size-8 text-[13px]" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`bg-gradient-brand grid shrink-0 place-items-center rounded-xl font-extrabold tracking-[-0.5px] text-white shadow-[0_6px_16px_-6px_rgba(219,39,119,0.6)] ${className}`}
    >
      ET
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="ET-Store home">
      <span className="transition duration-300 group-hover:rotate-[-8deg] group-hover:scale-110">
        <LogoMark />
      </span>
      <span className="text-lg font-semibold tracking-[-0.45px]">
        ET<span className="text-gradient">-Store</span>
      </span>
    </Link>
  );
}

export async function SiteHeader() {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    db.category.findMany({ select: { slug: true, name: true, icon: true } }),
  ]);
  const accountHref = user ? (user.role === "ADMIN" ? "/admin" : "/account") : "/login";
  return (
    <HeaderShell>
      <nav className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:gap-8" aria-label="Primary navigation">
        <Logo />
        <NavLinks categories={sortCategories(categories)} />
        <div className="ml-auto flex items-center gap-1">
          <SearchDialog className={iconBtn} />
          <Link href={user ? "/account" : "/login"} className={iconBtn} aria-label="Favorites">
            <Heart className="size-5" />
          </Link>
          <Link href="/cart" className={iconBtn} aria-label="Shopping bag">
            <ShoppingBag className="size-5" />
            <CartCount />
          </Link>
          <Link href={accountHref} className={`${iconBtn} ${user ? "bg-brand-soft" : ""}`} aria-label={user ? "Account" : "Log in"} title={user ? "Account" : "Log in"}>
            <User className="size-5" />
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </HeaderShell>
  );
}
