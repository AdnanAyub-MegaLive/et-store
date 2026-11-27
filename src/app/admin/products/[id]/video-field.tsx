"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, X } from "lucide-react";
import { uploadProductVideo } from "@/lib/actions/admin";

/** Optional product video: upload an MP4/WebM (up to 4 MB) or paste an https link to a video file. */
export function VideoField({ initial }: { initial: string }) {
  const [url, setUrl] = useState(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.size > 4 * 1024 * 1024) {
      setError("Video must be 4 MB or smaller. For a bigger video, paste its https link instead.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    start(async () => {
      const res = await uploadProductVideo(undefined, fd);
      if (res?.url) setUrl(res.url);
      else setError(res?.error ?? "Upload failed.");
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="label">Product video (optional)</span>
      <p className="-mt-1 text-xs text-muted">The featured image shows on product cards; this video plays when the product page is opened.</p>
      <div className="flex flex-wrap items-start gap-4">
        <div className="grid aspect-square w-32 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surface">
          {url ? (
            <video key={url} src={url} muted loop autoPlay playsInline className="size-full object-cover" />
          ) : (
            <span className="text-xs text-muted">No video</span>
          )}
        </div>
        <div className="flex min-w-[240px] flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <label className={`btn-outline w-fit cursor-pointer py-2 ${pending ? "pointer-events-none opacity-60" : ""}`}>
              <Upload className="size-4" />
              {pending ? "Uploading…" : "Upload video"}
              <input ref={fileRef} type="file" accept=".mp4,.webm,video/mp4,video/webm" onChange={onPick} className="sr-only" />
            </label>
            {url && (
              <button type="button" onClick={() => setUrl("")} className="btn-outline w-fit py-2">
                <X className="size-4" /> Remove
              </button>
            )}
          </div>
          <input name="video" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={500} placeholder="/uploads/... or https://...mp4" aria-label="Video path or URL" className="input" />
          <p className="text-xs text-muted">MP4 or WebM, up to 4 MB. For a bigger video, paste an https link to the video file.</p>
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}
