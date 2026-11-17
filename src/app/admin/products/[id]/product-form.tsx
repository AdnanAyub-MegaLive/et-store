"use client";

import { useActionState } from "react";
import type { Product } from "@prisma/client";
import { saveProduct } from "@/lib/actions/admin";

function F({ label, name, def, ...rest }: { label: string; name: string; def?: string | number | null } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="block"><span className="label">{label}</span><input name={name} defaultValue={def ?? ""} className="input" {...rest} /></label>;
}

export function ProductForm({ categories, product }: { categories: { id: string; name: string }[]; product: Product | null }) {
  const [state, action, pending] = useActionState(saveProduct, undefined);
  const p = product;
  return (
    <form action={action} className="card grid gap-4 p-6 sm:grid-cols-2">
      {state?.error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300 sm:col-span-2">{state.error}</p>}
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <F label="Name" name="name" def={p?.name} required maxLength={120} />
      <F label="Slug" name="slug" def={p?.slug} required pattern="[a-z0-9-]+" maxLength={120} />
      <div className="sm:col-span-2"><F label="Tagline" name="tagline" def={p?.tagline} required maxLength={200} /></div>
      <label className="block sm:col-span-2"><span className="label">Description</span><textarea name="description" defaultValue={p?.description} required rows={4} maxLength={5000} className="input" /></label>
      <F label="Price (USD)" name="price" type="number" step="0.01" min={0} def={p ? p.priceCents / 100 : ""} required />
      <F label="Compare-at price (optional)" name="compare" type="number" step="0.01" min={0} def={p?.compareCents ? p.compareCents / 100 : ""} />
      <label className="block">
        <span className="label">Category</span>
        <select name="categoryId" defaultValue={p?.categoryId} className="input" required>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <F label="Format (e.g. Animated, Static)" name="format" def={p?.format} required maxLength={60} />
      <F label="Image (/products/... or https URL)" name="image" def={p?.image ?? "/products/nova-ui-kit.png"} required maxLength={500} />
      <F label="Badge (optional)" name="badge" def={p?.badge} maxLength={30} />
      <label className="block sm:col-span-2"><span className="label">Features (one per line)</span><textarea name="features" defaultValue={p?.features.join("\n")} rows={4} maxLength={2000} className="input" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={p?.published ?? true} className="accent-brand" />Published</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={p?.featured ?? false} className="accent-brand" />Featured</label>
      <button disabled={pending} className="btn-primary sm:col-span-2">{pending ? "Saving…" : "Save product"}</button>
    </form>
  );
}
