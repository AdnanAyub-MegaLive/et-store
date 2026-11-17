"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Search } from "lucide-react";

export type FaqGroup = { title: string; color: string; items: { q: string; a: string }[] };

export function FaqSearch({ groups }: { groups: FaqGroup[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(groups[0]?.items[0]?.q ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length);
  }, [groups, query]);

  return (
    <div className="mx-auto max-w-3xl">
      <label className="group mb-6 flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 shadow-sm transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
        <Search className="size-5 text-muted group-focus-within:text-brand" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for answers, e.g. refund"
          aria-label="Search help articles"
          className="h-14 w-full bg-transparent outline-none placeholder:text-muted"
        />
      </label>

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {groups.map((g) => (
          <a key={g.title} href={`#faq-${g.title}`} className={`rounded-full bg-gradient-to-r ${g.color} px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5`}>
            {g.title}
          </a>
        ))}
      </div>

      {filtered.length === 0 && <p className="card p-8 text-center text-muted">No answers match “{query}”. Try another word, or contact us below.</p>}

      <div className="flex flex-col gap-8">
        {filtered.map((g) => (
          <section key={g.title} id={`faq-${g.title}`} className="scroll-mt-24">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <span className={`size-2.5 rounded-full bg-gradient-to-br ${g.color}`} />
              {g.title}
            </h2>
            <div className="card divide-y divide-line overflow-hidden">
              {g.items.map((item) => {
                const isOpen = open === item.q;
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : item.q)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium transition hover:bg-surface/60"
                    >
                      {item.q}
                      <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                        <ChevronDown className="size-4 text-muted" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 leading-7 text-muted">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
