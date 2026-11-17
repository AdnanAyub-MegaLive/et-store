import Link from "next/link";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
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
  const user = await getCurrentUser();
  const accountHref = user ? (user.role === "ADMIN" ? "/admin" : "/account") : "/login";
  return (
    <HeaderShell>
      <nav className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:gap-8" aria-label="Primary navigation">
        <Logo />
        <NavLinks />
        <form action="/shop" className="group hidden max-w-[448px] flex-1 items-center rounded-xl border border-line bg-surface px-3 transition focus-within:border-brand focus-within:bg-panel focus-within:ring-4 focus-within:ring-brand/10 md:flex">
          <Search className="size-4 text-muted transition group-focus-within:text-brand" aria-hidden />
          <input name="q" placeholder="Search digital products" aria-label="Search digital products" className="h-9 w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted" />
        </form>
        <div className="ml-auto flex items-center gap-1">
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
