"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "./favorites-context";

export function FavoriteButton({ productId, name }: { productId: string; name: string }) {
  const { has, toggle, pending } = useFavorites();
  const fav = has(productId);
  return (
    <button
      type="button"
      aria-label={fav ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
      aria-pressed={fav}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        toggle(productId);
      }}
      className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-xl bg-panel/90 shadow-sm transition hover:scale-110 hover:bg-panel active:scale-90"
    >
      <Heart className={`size-4 transition duration-300 ${fav ? "scale-110 fill-pink-500 text-pink-500" : "hover:text-pink-500"}`} />
    </button>
  );
}
