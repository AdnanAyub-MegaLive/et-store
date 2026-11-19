"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Plus, Trash2 } from "lucide-react";
import type { HeaderContent } from "@/lib/header-content-schema";
import { resetHeaderContent, saveHeaderContent } from "@/lib/actions/admin";
import { ImageField } from "../products/[id]/image-field";

const ICONS: { key: keyof HeaderContent["icons"]; label: string }[] = [
  { key: "search", label: "Search" },
  { key: "favorites", label: "Favorites (heart)" },
  { key: "cart", label: "Cart" },
  { key: "theme", label: "Dark / light toggle" },
];

function Field({ label, value, onChange, max, placeholder }: { label: string; value: string; onChange: (v: string) => void; max: number; placeholder?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} placeholder={placeholder} className="input" />
    </label>
  );
}

export function HeaderEditor({ initial }: { initial: HeaderContent }) {
  const [c, setC] = useState<HeaderContent>(initial);
  const [state, action, pending] = useActionState(saveHeaderContent, undefined);
  const [dirty, setDirty] = useState(false);

  const update = (fn: (v: HeaderContent) => HeaderContent) => {
    setC(fn);
    setDirty(true);
  };
  const setLink = (i: number, patch: Partial<HeaderContent["links"][number]>) =>
    update((v) => ({ ...v, links: v.links.map((l, k) => (k === i ? { ...l, ...patch } : l)) }));
  const moveLink = (i: number, d: number) =>
    update((v) => {
      const links = [...v.links];
      [links[i], links[i + d]] = [links[i + d], links[i]];
      return { ...v, links };
    });

  const btn = "grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink disabled:opacity-30";

  return (
    <form action={action} onSubmit={() => setDirty(false)} className="flex flex-col gap-6">
      <input type="hidden" name="data" value={JSON.stringify(c)} />

      {/* Live preview */}
      <section className="card overflow-x-auto p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Preview</p>
        <div className="flex min-w-[560px] items-center gap-6 rounded-xl border border-line bg-surface px-4 py-3">
          {c.logo.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview of the admin's logo
            <img src={c.logo.image} alt="Logo preview" className="h-9 w-auto max-w-[180px] object-contain" />
          ) : (
            <span className="flex items-center gap-2">
              {c.logo.mark && (
                <span className="bg-gradient-brand grid size-8 place-items-center rounded-xl text-[13px] font-extrabold text-white">{c.logo.mark}</span>
              )}
              <span className="text-lg font-semibold">
                {c.logo.text}
                <span className="text-gradient">{c.logo.highlight}</span>
              </span>
            </span>
          )}
          <span className="flex gap-5 text-sm font-medium text-muted">
            {c.links.map((l, i) => (
              <span key={i} className="flex items-center gap-1">
                {l.label || "…"}
                {l.dropdown && <ChevronDown className="size-3.5" />}
              </span>
            ))}
          </span>
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Logo</h2>
          <p className="text-sm text-muted">Upload a logo image, or leave it empty to use the coloured mark and text below.</p>
        </div>
        <ImageField name="" label="Logo image (optional)" required={false} initial={c.logo.image} onChange={(v) => update((x) => ({ ...x, logo: { ...x.logo, image: v } }))} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Mark letters (in the coloured box)" value={c.logo.mark} max={3} placeholder="ET" onChange={(v) => update((x) => ({ ...x, logo: { ...x.logo, mark: v } }))} />
          <Field label="Name" value={c.logo.text} max={30} placeholder="ET" onChange={(v) => update((x) => ({ ...x, logo: { ...x.logo, text: v } }))} />
          <Field label="Coloured part of the name" value={c.logo.highlight} max={30} placeholder="-Store" onChange={(v) => update((x) => ({ ...x, logo: { ...x.logo, highlight: v } }))} />
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Menu links</h2>
          <p className="text-sm text-muted">Shown on desktop next to the logo. Turn on “Categories dropdown” to open the category menu on hover.</p>
        </div>
        {c.links.map((l, i) => (
          <div key={i} className="grid items-end gap-3 rounded-xl border border-line p-4 sm:grid-cols-[1fr_1.5fr_auto_auto]">
            <Field label="Label" value={l.label} max={30} onChange={(v) => setLink(i, { label: v })} />
            <Field label="Link" value={l.href} max={300} placeholder="/shop" onChange={(v) => setLink(i, { href: v })} />
            <label className="flex h-10 cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={l.dropdown} onChange={() => setLink(i, { dropdown: !l.dropdown })} className="size-4 accent-brand" />
              Categories dropdown
            </label>
            <div className="flex h-10 items-center gap-1">
              <button type="button" className={btn} onClick={() => moveLink(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="size-4" /></button>
              <button type="button" className={btn} onClick={() => moveLink(i, 1)} disabled={i === c.links.length - 1} aria-label="Move down"><ArrowDown className="size-4" /></button>
              <button type="button" className={`${btn} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15`} onClick={() => update((x) => ({ ...x, links: x.links.filter((_, k) => k !== i) }))} aria-label="Remove">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {c.links.length < 8 && (
          <button type="button" className="btn-outline w-fit py-2" onClick={() => update((x) => ({ ...x, links: [...x.links, { label: "New link", href: "/", dropdown: false }] }))}>
            <Plus className="size-4" />Add menu link
          </button>
        )}
      </section>

      <section className="card flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Icons</h2>
          <p className="text-sm text-muted">The account (login) icon is always shown.</p>
        </div>
        <div className="flex flex-wrap gap-6">
          {ICONS.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={c.icons[key]} onChange={() => { const on = !c.icons[key]; update((x) => ({ ...x, icons: { ...x.icons, [key]: on } })); }} className="size-4 accent-brand" />
              {label}
            </label>
          ))}
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel/95 px-5 py-3 shadow-lg backdrop-blur">
        <div className="text-sm" aria-live="polite">
          {state?.error && !dirty ? (
            <span className="text-red-600 dark:text-red-300">{state.error}</span>
          ) : state?.ok && !dirty ? (
            <span className="text-emerald-600 dark:text-emerald-400">Saved. The header is updated.</span>
          ) : dirty ? (
            <span className="text-amber-600 dark:text-amber-400">You have unsaved changes.</span>
          ) : (
            <span className="text-muted">No changes yet.</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" target="_blank" className="btn-outline py-2"><ExternalLink className="size-4" />View store</Link>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface hover:text-red-600"
            onClick={async () => {
              if (!confirm("Reset the header to the original logo and menu? Your changes will be lost.")) return;
              await resetHeaderContent();
              location.reload();
            }}
          >
            Reset to default
          </button>
          <button disabled={pending} className="btn-primary py-2">{pending ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </form>
  );
}
