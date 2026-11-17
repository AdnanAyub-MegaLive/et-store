"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";

const suggestions = ["Templates", "UI Kits", "Notion", "Icons", "eBooks"];

export function SearchDialog({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function go(q: string) {
    const term = q.trim();
    setOpen(false);
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} aria-label="Search" title="Search (Ctrl+K)">
        <Search className="size-5" />
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search products">
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  go(inputRef.current?.value ?? "");
                }}
                className="flex items-center gap-3 border-b border-line px-4"
              >
                <Search className="size-5 shrink-0 text-brand" aria-hidden />
                <input
                  ref={inputRef}
                  autoFocus
                  name="q"
                  placeholder="Search digital products"
                  aria-label="Search digital products"
                  className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted"
                />
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-ink" aria-label="Close search">
                  <X className="size-5" />
                </button>
              </form>
              <div className="p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => go(s)}
                      className="rounded-full border border-line px-3 py-1.5 text-sm transition hover:border-brand hover:bg-brand-soft hover:text-brand"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted">Press Enter to search, Esc to close.</p>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}
    </>
  );
}
