"use client";

import { useEffect, useRef } from "react";
import { animate, inView, scroll, stagger } from "motion";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Splits an element's text into word spans (each inside an overflow mask) and returns the inner spans. */
function splitWords(el: HTMLElement) {
  if (el.dataset.splitDone) return Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
  const words = (el.textContent ?? "").trim().split(/\s+/);
  el.setAttribute("aria-label", words.join(" "));
  el.innerHTML = words
    .map((w) => `<span aria-hidden="true" style="display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:0.08em"><span data-word style="display:inline-block;will-change:transform">${w.replace(/</g, "&lt;")}</span></span>`)
    .join(" ");
  el.dataset.splitDone = "1";
  return Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
}

/**
 * Declarative Framer Motion (motion.dev) effects. Mark elements with data attributes:
 *  data-split            headline rises in word by word
 *  data-stagger          children cascade in when the group scrolls into view
 *  data-pop="0.3"        pops in with a springy overshoot (value = delay)
 *  data-slide="left|right" slides in from the side
 *  data-parallax="0.2"   scroll-linked vertical drift
 *  data-count="12000"    counts up (data-prefix, data-suffix, data-decimals, data-compact)
 *  data-marquee          endless horizontal loop (pauses on hover)
 * Everything is skipped when the visitor prefers reduced motion.
 */
export function MotionEffects({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const $ = <T extends HTMLElement>(s: string) => Array.from(el.querySelectorAll<T>(s));
    const cleanups: VoidFunction[] = [];

    $("[data-split]").forEach((h) => {
      const words = splitWords(h);
      animate(words, { y: ["110%", "0%"], rotateX: [-40, 0], opacity: [0, 1] }, { duration: 0.9, ease: EASE_OUT, delay: stagger(0.07, { startDelay: 0.1 }) });
    });

    $("[data-stagger]").forEach((group) => {
      const kids = Array.from(group.children) as HTMLElement[];
      kids.forEach((k) => (k.style.opacity = "0"));
      cleanups.push(
        inView(group, () => {
          animate(kids, { opacity: [0, 1], y: [40, 0], scale: [0.96, 1] }, { duration: 0.8, ease: EASE_OUT, delay: stagger(0.08) });
        }, { amount: 0.1 }),
      );
    });

    $("[data-pop]").forEach((p) => {
      p.style.opacity = "0";
      cleanups.push(
        inView(p, () => {
          animate(p, { opacity: [0, 1], scale: [0.6, 1] }, { type: "spring", stiffness: 380, damping: 14, delay: Number(p.dataset.pop) || 0 });
        }),
      );
    });

    $("[data-slide]").forEach((s) => {
      s.style.opacity = "0";
      const from = s.dataset.slide === "right" ? 60 : -60;
      cleanups.push(inView(s, () => { animate(s, { opacity: [0, 1], x: [from, 0] }, { duration: 0.9, ease: EASE_OUT }); }, { amount: 0.1 }));
    });

    $("[data-parallax]").forEach((p) => {
      const speed = parseFloat(p.dataset.parallax ?? "0.2");
      const target = p.closest("section") ?? p;
      cleanups.push(scroll(animate(p, { y: [`${speed * 50}%`, `${speed * -50}%`] }, { ease: "linear" }), { target, offset: ["start end", "end start"] }));
    });

    $("[data-count]").forEach((c) => {
      const end = Number(c.dataset.count);
      const { prefix = "", suffix = "" } = c.dataset;
      const dec = Number(c.dataset.decimals ?? 0);
      const compact = "compact" in c.dataset || (end >= 1000 && suffix === "+");
      const fmt = (n: number) =>
        prefix + (compact ? `${Math.round(n / 1000)}k` : n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })) + suffix;
      c.textContent = fmt(0);
      cleanups.push(inView(c, () => { animate(0, end, { duration: 1.8, ease: EASE_OUT, onUpdate: (v) => (c.textContent = fmt(v)) }); }));
    });

    $("[data-marquee]").forEach((track) => {
      const ctl = animate(track, { x: ["0%", "-50%"] }, { duration: 30, ease: "linear", repeat: Infinity });
      const slow = () => (ctl.speed = 0.2);
      const fast = () => (ctl.speed = 1);
      track.addEventListener("mouseenter", slow);
      track.addEventListener("mouseleave", fast);
      cleanups.push(() => ctl.stop());
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return <div ref={root}>{children}</div>;
}
