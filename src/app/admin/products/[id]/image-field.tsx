"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { uploadProductImage } from "@/lib/actions/admin";

/** Product image: upload a file (SVG, PNG, JPG, WebP) or paste a path / https URL. */
export function ImageField({ initial }: { initial: string }) {
  const [url, setUrl] = useState(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    start(async () => {
      const res = await uploadProductImage(undefined, fd);
      if (res?.url) setUrl(res.url);
      else setError(res?.error ?? "Upload failed.");
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="label">Featured image</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surface">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- live preview of any path or URL the admin types
            <img src={url} alt="Product image preview" className="size-full object-cover" />
          ) : (
            <span className="text-xs text-muted">No image</span>
          )}
        </div>
        <div className="flex min-w-[240px] flex-1 flex-col gap-2">
          <label className={`btn-outline w-fit cursor-pointer py-2 ${pending ? "pointer-events-none opacity-60" : ""}`}>
            <Upload className="size-4" />
            {pending ? "Uploading…" : "Upload image"}
            <input ref={fileRef} type="file" accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp" onChange={onPick} className="sr-only" />
          </label>
          <input name="image" value={url} onChange={(e) => setUrl(e.target.value)} required maxLength={500} placeholder="/uploads/... or https://..." aria-label="Image path or URL" className="input" />
          <p className="text-xs text-muted">SVG, PNG, JPG or WebP, up to 2 MB. Or paste an image path or https link.</p>
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}
