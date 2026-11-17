"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/shop", label: "Browse" },
  { href: "/#categories", label: "Categories" },
  { href: "/shop?sort=featured", label: "Bundles" },
  { href: "/#resources", label: "Resources" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <div className="hidden items-center gap-6 lg:flex">
      {links.map((l, i) => {
        const active = i === 0 ? path === "/" || path.startsWith("/shop") || path.startsWith("/products") : false;
        return (
          <Link
            key={l.label}
            href={l.href}
            className={`group relative py-5 text-sm font-medium transition-colors ${active ? "text-brand" : "text-muted hover:text-ink"}`}
          >
            {l.label}
            <span
              aria-hidden
              className={`absolute inset-x-0 -bottom-px h-0.5 origin-left rounded-full bg-brand transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
            />
          </Link>
        );
      })}
    </div>
  );
}
