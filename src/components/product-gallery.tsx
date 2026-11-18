"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Product image slider: featured image + gallery, with arrows, swipe, keyboard and thumbnails. */
export function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const [active, setActive] = useState(0);
  const count = images.length;
  const many = count > 1;
  const touchX = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const go = (i: number) => setActive((i + count) % count);
  const step = (d: number) => setActive((a) => (a + d + count) % count);
  const prev = () => step(-1);
  const next = () => step(1);

  // Keep the active thumbnail in view when there are many.
  // Only the thumbnail strip scrolls sideways, never the page.
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const left = thumb.offsetLeft - strip.offsetLeft;
    if (left < strip.scrollLeft || left + thumb.offsetWidth > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: left - strip.clientWidth / 2 + thumb.offsetWidth / 2, behavior: "smooth" });
    }
  }, [active]);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="group relative aspect-square overflow-hidden rounded-[18px] border border-line bg-surface outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${name} images`}
        tabIndex={many ? 0 : -1}
        onKeyDown={(e) => {
          if (!many) return;
          if (e.key === "ArrowLeft") prev();
          if (e.key === "ArrowRight") next();
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (!many || touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
          touchX.current = null;
        }}
      >
        {/* Sliding track */}
        <div className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `translateX(-${active * 100}%)` }}>
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="relative h-full w-full shrink-0" aria-hidden={i !== active}>
              <Image src={src} alt={i === 0 ? name : `${name}, image ${i + 1}`} fill priority={i === 0} sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            </div>
          ))}
        </div>

        <span className="absolute left-3 top-3 rounded-lg bg-panel/90 px-3 py-1 text-xs font-medium">Preview</span>

        {many && (
          <>
            <button type="button" onClick={prev} aria-label="Previous image" className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-panel/90 text-ink shadow-md transition hover:scale-110 hover:bg-panel hover:text-brand sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={next} aria-label="Next image" className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-panel/90 text-ink shadow-md transition hover:scale-110 hover:bg-panel hover:text-brand sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute right-3 top-3 rounded-lg bg-panel/90 px-2.5 py-1 text-xs font-medium tabular-nums" aria-live="polite">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>

      {many && (
        <div ref={thumbsRef} className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show image ${i + 1} of ${count}`}
              aria-current={i === active}
              className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border-2 transition hover:-translate-y-0.5 hover:border-brand sm:w-24 ${i === active ? "border-brand" : "border-line opacity-75 hover:opacity-100"}`}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
