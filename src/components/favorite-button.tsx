"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFavorite } from "@/lib/actions/store";

export function FavoriteButton({ productId, name, initial = false }: { productId: string; name: string; initial?: boolean }) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={`Favorite ${name}`}
      aria-pressed={fav}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await toggleFavorite(productId);
          if ("error" in r) router.push("/login");
          else setFav(r.favorited);
        })
      }
      className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-xl bg-panel/90 shadow-sm transition hover:scale-110 hover:bg-panel active:scale-90"
    >
      <Heart className={`size-4 transition duration-300 ${fav ? "scale-110 fill-brand text-brand" : "hover:text-brand"}`} />
    </button>
  );
}
