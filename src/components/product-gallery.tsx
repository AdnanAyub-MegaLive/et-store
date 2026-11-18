"use client";

import { useState } from "react";
import Image from "next/image";

/** Featured image plus clickable gallery thumbnails. */
export function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="group relative aspect-square overflow-hidden rounded-[18px] border border-line bg-surface">
        <Image key={current} src={current} alt={name} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="animate-fade-in object-cover transition duration-700 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-lg bg-panel/90 px-3 py-1 text-xs font-medium">Preview</span>
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-lg bg-panel/90 px-2.5 py-1 text-xs font-medium tabular-nums">
            {active + 1} / {images.length}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5" role="list" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              role="listitem"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === active}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition hover:-translate-y-0.5 hover:border-brand ${i === active ? "border-brand" : "border-line opacity-80 hover:opacity-100"}`}
            >
              <Image src={src} alt="" fill sizes="(max-width:640px) 25vw, 10vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
