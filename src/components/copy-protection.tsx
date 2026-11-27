"use client";

import { useEffect } from "react";

/** Form fields stay fully usable (typing, pasting, selecting). */
const isEditable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || !!t.closest("input, textarea, select, [contenteditable='true']"));

/**
 * Makes casual copying of storefront text and images harder: no text selection,
 * no right-click menu, no image dragging, and copy/save/view-source/print shortcuts blocked.
 * It is a deterrent only: screenshots and browser dev tools can't be blocked by any website.
 */
export function CopyProtection() {
  useEffect(() => {
    const block = (e: Event) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const keys = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (e.key === "F12" || (mod && e.shiftKey && ["i", "j", "c"].includes(k))) return e.preventDefault();
      if (mod && ["u", "s", "p"].includes(k)) return e.preventDefault();
      if (mod && ["c", "x", "a"].includes(k) && !isEditable(e.target)) e.preventDefault();
    };
    const events = ["contextmenu", "copy", "cut", "dragstart", "selectstart"] as const;
    events.forEach((n) => document.addEventListener(n, block));
    document.addEventListener("keydown", keys);
    document.documentElement.classList.add("no-copy");
    return () => {
      events.forEach((n) => document.removeEventListener(n, block));
      document.removeEventListener("keydown", keys);
      document.documentElement.classList.remove("no-copy");
    };
  }, []);
  return null;
}
