"use client";

import { useActionState, useState } from "react";
import type { Product } from "@/lib/db";
import { saveProduct } from "@/lib/actions/admin";
import { ImageField } from "./image-field";
import { GalleryField } from "./gallery-field";
import { VideoField } from "./video-field";

/** Name → url slug: "Golden Crown Frame!" → "golden-crown-frame". */
const slugify = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);

function F({ label, name, def, ...rest }: { label: string; name: string; def?: string | number | null } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="block"><span className="label">{label}</span><input name={name} defaultValue={def ?? ""} className="input" {...rest} /></label>;
}

export function ProductForm({ categories, product }: { categories: { id: string; name: string }[]; product: Product | null }) {
  const [state, action, pending] = useActionState(saveProduct, undefined);
  const p = product;
  const [name, setName] = useState(p?.name ?? "");
  const [slug, setSlug] = useState(p?.slug ?? "");
  // A new product's slug follows its name until the slug is edited by hand.
  const [slugEdited, setSlugEdited] = useState(!!p);
  return (
    <form action={action} className="card grid gap-4 p-6 sm:grid-cols-2">
      {state?.error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300 sm:col-span-2">{state.error}</p>}
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <label className="block">
        <span className="label">Name</span>
        <input name="name" value={name} onChange={(e) => { setName(e.target.value); if (!slugEdited) setSlug(slugify(e.target.value)); }} required maxLength={120} className="input" />
      </label>
      <label className="block">
        <span className="label">Slug (auto from name)</span>
        <input name="slug" value={slug} onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-")); setSlugEdited(true); }} pattern="[a-z0-9-]*" maxLength={120} placeholder="made from the name" className="input" />
      </label>
      <div className="sm:col-span-2"><F label="Tagline" name="tagline" def={p?.tagline} required maxLength={200} /></div>
      <label className="block sm:col-span-2"><span className="label">Description (optional)</span><textarea name="description" defaultValue={p?.description} rows={4} maxLength={5000} className="input" /></label>
      <F label="Price (USD)" name="price" type="number" step="0.01" min={0} def={p ? p.priceCents / 100 : ""} required />
      <F label="Compare-at price (optional)" name="compare" type="number" step="0.01" min={0} def={p?.compareCents ? p.compareCents / 100 : ""} />
      <label className="block">
        <span className="label">Category</span>
        <select name="categoryId" defaultValue={p?.categoryId} className="input" required>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <ImageField initial={p?.image ?? ""} />
      <VideoField initial={p?.video ?? ""} />
      <GalleryField initial={p?.gallery ?? []} />
      <F label="Badge (optional)" name="badge" def={p?.badge} maxLength={30} />
      <label className="block sm:col-span-2"><span className="label">Features (one per line)</span><textarea name="features" defaultValue={p?.features.join("\n")} rows={4} maxLength={2000} className="input" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={p?.published ?? true} className="accent-brand" />Published</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={p?.featured ?? false} className="accent-brand" />Featured</label>
      <button disabled={pending} className="btn-primary sm:col-span-2">{pending ? "Saving…" : "Save product"}</button>
    </form>
  );
}
