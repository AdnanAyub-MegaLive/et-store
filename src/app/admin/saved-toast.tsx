"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, X } from "lucide-react";

/** Small "Saved" popup shown for a few seconds after a successful save. Pass the action state. */
export function SavedToast({ state, message = "Changes saved" }: { state: { ok?: boolean } | undefined; message?: string }) {
  const [seen, setSeen] = useState(state);
  const [open, setOpen] = useState(false);
  if (seen !== state) {
    setSeen(state);
    setOpen(!!state?.ok);
  }
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), 3000);
    return () => clearTimeout(t);
  }, [open, state]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="fixed left-1/2 top-6 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-200 bg-panel px-5 py-3 text-sm font-medium shadow-xl dark:border-emerald-500/30"
        >
          <CheckCircle2 className="size-5 text-emerald-500" />
          {message}
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="ml-2 text-muted hover:text-ink">
            <X className="size-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
