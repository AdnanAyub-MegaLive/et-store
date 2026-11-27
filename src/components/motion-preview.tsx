"use client";

import { useState } from "react";

/** Looping Mall motion preview (MP4, or animated WebP for GIF items), falling back to the still image. */
export function MotionPreview({ src, poster, name }: { src: string; poster: string; name: string }) {
  const [asImage, setAsImage] = useState(false);
  const cls = "aspect-square w-full rounded-[18px] bg-surface object-contain";
  return asImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className={cls} onError={(e) => (e.currentTarget.src = poster)} />
  ) : (
    <video src={src} poster={poster} autoPlay loop muted playsInline aria-label={name} className={cls} onError={() => setAsImage(true)} />
  );
}
