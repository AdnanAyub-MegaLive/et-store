"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, X } from "lucide-react";
import { uploadProductImage } from "@/lib/actions/admin";

const MAX = 10;

/** Extra product images shown under the featured image on the product page. */
export function GalleryField({ initial }: { initial: string[] }) {
  const [images, setImages] = useState<string[]>(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX - images.length);
    if (!files.length) return;
    setError("");
    start(async () => {
      const added: string[] = [];
      const errors: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadProductImage(undefined, fd);
        if (res?.url) added.push(res.url);
        else errors.push(`${file.name}: ${res?.error ?? "upload failed"}`);
      }
      setImages((prev) => [...prev, ...added].slice(0, MAX));
      if (errors.length) setError(errors.join(" "));
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  const move = (i: number, dir: -1 | 1) =>
    setImages((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="label">Gallery images <span className="font-normal text-muted">({images.length}/{MAX}, shown under the featured image)</span></span>
      <input type="hidden" name="gallery" value={JSON.stringify(images)} />
      <div className="flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="group relative size-24 overflow-hidden rounded-xl border border-line bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of uploaded files */}
            <img src={src} alt={`Gallery image ${i + 1}`} className="size-full object-cover" />
            <button type="button" onClick={() => setImages((prev) => prev.filter((_, k) => k !== i))} aria-label={`Remove image ${i + 1}`} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100">
              <X className="size-3.5" />
            </button>
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left" className="rounded bg-black/60 px-1.5 text-xs text-white disabled:opacity-30">‹</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move right" className="rounded bg-black/60 px-1.5 text-xs text-white disabled:opacity-30">›</button>
            </div>
          </div>
        ))}
        {images.length < MAX && (
          <label className={`grid size-24 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line text-muted transition hover:border-brand hover:text-brand ${pending ? "pointer-events-none opacity-60" : ""}`}>
            <span className="flex flex-col items-center gap-1 text-xs">
              <ImagePlus className="size-5" />
              {pending ? "Uploading…" : "Add images"}
            </span>
            <input ref={fileRef} type="file" multiple accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp" onChange={onPick} className="sr-only" />
          </label>
        )}
      </div>
      <p className="text-xs text-muted">Select several files at once. Hover an image to reorder or remove it.</p>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}
