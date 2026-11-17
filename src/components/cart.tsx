"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { id: string; qty: number };
type Ctx = {
  lines: CartLine[];
  count: number;
  add: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  ready: boolean;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "lm_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage after mount (reading it during render would break SSR hydration).
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(raw)) setLines(raw.filter((l) => typeof l?.id === "string" && Number.isInteger(l?.qty)).slice(0, 50));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback(
    (id: string) =>
      setLines((ls) => (ls.some((l) => l.id === id) ? ls.map((l) => (l.id === id ? { ...l, qty: Math.min(10, l.qty + 1) } : l)) : [...ls, { id, qty: 1 }])),
    [],
  );
  const setQty = useCallback((id: string, qty: number) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l))), []);
  const remove = useCallback((id: string) => setLines((ls) => ls.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((s, l) => s + l.qty, 0), add, setQty, remove, clear, ready }),
    [lines, add, setQty, remove, clear, ready],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

export function CartCount() {
  const { count } = useCart();
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0 }}
          animate={{ scale: [1.6, 1] }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-[10px] font-semibold text-white"
        >
          {count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
