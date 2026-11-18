"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LayoutDashboard, Mail, Package, ShoppingCart, Users } from "lucide-react";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/home", label: "Home page", icon: House },
];

export function AdminNav({ compact = false }: { compact?: boolean }) {
  const path = usePathname();
  return (
    <nav className={compact ? "flex gap-1" : "flex flex-col gap-1"}>
      {items.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${active ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface hover:text-ink"}`}>
            <i.icon className="size-4" />
            {!compact && i.label}
          </Link>
        );
      })}
    </nav>
  );
}
