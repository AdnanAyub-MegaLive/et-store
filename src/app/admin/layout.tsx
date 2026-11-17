import Link from "next/link";
import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { logout } from "@/lib/actions/auth";
import { Logo } from "@/components/site-header";
import { AdminNav } from "./admin-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const initials = admin.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex min-h-screen bg-page">
      <aside className="hidden w-64 shrink-0 flex-col gap-8 border-r border-line bg-panel p-6 md:flex">
        <Logo />
        <AdminNav />
        <form action={logout} className="mt-auto"><button className="text-sm text-muted hover:text-ink">Sign out</button></form>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-line px-6 lg:px-8">
          <div className="md:hidden"><AdminNav compact /></div>
          <Link href="/" className="hidden text-sm text-muted hover:text-ink md:block">← View store</Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Bell className="size-4 text-muted" aria-hidden />
            <span className="flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-1.5 text-sm">
              <span className="grid size-7 place-items-center rounded-full bg-brand text-[11px] font-semibold text-on-brand">{initials}</span>
              {admin.name}
            </span>
          </div>
        </header>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
