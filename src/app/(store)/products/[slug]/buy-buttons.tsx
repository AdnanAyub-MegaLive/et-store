"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart";

export function BuyButtons({ id }: { id: string }) {
  const { add, lines } = useCart();
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const inCart = lines.some((l) => l.id === id);
  return (
    <div className="flex flex-col gap-3">
      <button
        className="btn-primary"
        onClick={() => {
          add(id);
          setAdded(true);
        }}
      >
        <ShoppingBag className="size-4" />
        {added || inCart ? "Added! Add another" : "Add to cart"}
      </button>
      <button
        className="btn-outline bg-panel"
        onClick={() => {
          if (!inCart) add(id);
          router.push("/checkout");
        }}
      >
        Buy now
      </button>
    </div>
  );
}
