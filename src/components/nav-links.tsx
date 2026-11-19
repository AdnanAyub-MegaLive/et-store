"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { iconFor } from "./icons";

export type NavCategory = { slug: string; name: string; icon: string };

export type NavLink = { label: string; href: string; dropdown: boolean };

/** Is this menu link for the page we're on? (Hash links like /#categories are never "active".) */
function isActive(href: string, path: string) {
  // Hash, query (e.g. /shop?sort=…) and outside links never show as active, so only one item is highlighted.
  if (href.includes("#") || href.includes("?") || href.startsWith("http")) return false;
  const target = href.split("?")[0] || "/";
  if (target === "/") return path === "/";
  if (target === "/shop") return path.startsWith("/shop") || path.startsWith("/products");
  return path === target || path.startsWith(`${target}/`);
}

const underline = (active: boolean) =>
  `absolute inset-x-0 -bottom-px h-0.5 origin-left rounded-full bg-brand transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`;

export function NavLinks({ links, categories }: { links: NavLink[]; categories: NavCategory[] }) {
  const path = usePathname();
  return (
    <div className="hidden items-center gap-6 lg:flex">
      {links.map((l, i) => {
        const active = isActive(l.href, path);
        const linkClass = `group relative flex items-center gap-1 py-5 text-sm font-medium transition-colors ${active ? "text-brand" : "text-muted hover:text-ink"}`;

        if (l.dropdown && categories.length) {
          return (
            <div key={i} className="group/menu relative">
              <Link href={l.href} className={`${linkClass} group-hover/menu:text-ink`} aria-haspopup="true">
                {l.label}
                <ChevronDown className="size-3.5 transition-transform duration-300 group-hover/menu:rotate-180" aria-hidden />
                <span aria-hidden className={underline(false)} />
              </Link>
              <div className="invisible absolute -left-32 top-full z-50 w-[720px] translate-y-2 pt-1 opacity-0 transition duration-200 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100">
                <div className="grid grid-cols-3 gap-1 rounded-2xl border border-line bg-panel p-2 shadow-[0_24px_48px_-20px_rgba(103,48,204,0.45)]">
                  {categories.map((c) => {
                    const Icon = iconFor(c.icon);
                    return (
                      <Link
                        key={c.slug}
                        href={`/shop?category=${c.slug}`}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-brand-soft hover:text-brand"
                      >
                        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white transition group-hover:from-fuchsia-500 group-hover:to-pink-500">
                          <Icon className="size-4" />
                        </span>
                        {c.name}
                      </Link>
                    );
                  })}
                  <Link href="/shop" className="col-span-3 mt-1 rounded-xl border-t border-line px-3 pt-3 pb-1.5 text-center text-sm font-medium text-brand hover:underline">
                    View all products
                  </Link>
                </div>
              </div>
            </div>
          );
        }

        return (
          <Link key={i} href={l.href} className={linkClass}>
            {l.label}
            <span aria-hidden className={underline(active)} />
          </Link>
        );
      })}
    </div>
  );
}
