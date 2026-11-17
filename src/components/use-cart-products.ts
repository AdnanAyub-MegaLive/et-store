"use client";

import { useEffect, useState } from "react";
import { getCartProducts } from "@/lib/actions/store";
import { useCart } from "./cart";

export type CartProduct = Awaited<ReturnType<typeof getCartProducts>>[number];

/** Resolves cart ids to live DB products and drops anything no longer for sale. */
export function useCartProducts() {
  const { lines, ready, remove } = useCart();
  const [products, setProducts] = useState<CartProduct[] | null>(null);
  const key = lines.map((l) => l.id).sort().join(",");

  useEffect(() => {
    if (!ready || !key) return;
    let live = true;
    getCartProducts(key.split(","))
      .then((ps) => {
        if (!live) return;
        setProducts(ps);
        key.split(",").filter((id) => !ps.some((p) => p.id === id)).forEach(remove);
      })
      .catch(() => live && setProducts([]));
    return () => {
      live = false;
    };
  }, [key, ready, remove]);

  const rows = (key ? (products ?? []) : []).flatMap((p) => {
    const l = lines.find((x) => x.id === p.id);
    return l ? [{ ...p, qty: l.qty }] : [];
  });
  const subtotal = rows.reduce((s, r) => s + r.priceCents * r.qty, 0);
  return { rows, subtotal, loading: !ready || (!!key && products === null) };
}
