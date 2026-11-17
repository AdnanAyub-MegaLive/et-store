"use client";

import { useEffect, useState } from "react";

/** Sticky header that gains a soft shadow once the page scrolls. */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={`sticky top-0 z-40 border-b bg-page/85 backdrop-blur-md transition-[box-shadow,border-color] duration-300 ${
        scrolled ? "border-line shadow-[0_8px_24px_-16px_rgba(16,16,28,0.25)]" : "border-line"
      }`}
    >
      {children}
    </header>
  );
}
