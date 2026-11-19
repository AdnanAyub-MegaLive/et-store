"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toggleFavorite } from "@/lib/actions/store";

type Fav = { has: (id: string) => boolean; toggle: (id: string) => void; count: number; pending: boolean };
const Ctx = createContext<Fav | null>(null);

/** Knows which products the signed-in customer has hearted, so every heart on the page shows the right state. */
export function FavoritesProvider({ initial, children }: { initial: string[]; children: React.ReactNode }) {
  const [ids, setIds] = useState(() => new Set(initial));
  const [pending, start] = useTransition();
  const router = useRouter();
  const path = usePathname();

  const toggle = (id: string) =>
    start(async () => {
      const r = await toggleFavorite(id);
      if ("error" in r) {
        router.push(`/login?next=${encodeURIComponent(path)}`);
        return;
      }
      setIds((prev) => {
        const next = new Set(prev);
        if (r.favorited) next.add(id);
        else next.delete(id);
        return next;
      });
      router.refresh(); // keeps the favorites page list in sync
    });

  return <Ctx.Provider value={{ has: (id) => ids.has(id), toggle, count: ids.size, pending }}>{children}</Ctx.Provider>;
}

export function useFavorites() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFavorites must be used inside FavoritesProvider");
  return c;
}

/** Small count bubble on the header heart. */
export function FavoritesCount() {
  const { count } = useFavorites();
  if (!count) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-pink-500 px-1 text-[10px] font-semibold leading-4 text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
