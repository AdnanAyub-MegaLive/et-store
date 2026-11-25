"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { ABOUT_ICONS, STAT_SOURCES, type AboutContent } from "@/lib/about-content-schema";
import { resetAboutContent, saveAboutContent } from "@/lib/actions/admin";

type Updater<T> = (fn: (v: T) => T) => void;

function Section({ title, hint, children, toggle }: { title: string; hint?: string; children: React.ReactNode; toggle?: React.ReactNode }) {
  return (
    <section className="card flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {hint && <p className="text-sm text-muted">{hint}</p>}
        </div>
        {toggle}
      </div>
      {children}
    </section>
  );
}

function Text({ label, value, onChange, max, area, placeholder }: { label: string; value: string; onChange: (v: string) => void; max: number; area?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} rows={4} placeholder={placeholder} className="input" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} placeholder={placeholder} className="input" />
      )}
    </label>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={checked} onChange={() => onChange(!checked)} className="size-4 accent-brand" />
      Show on About page
    </label>
  );
}

/** Move up / move down / remove buttons for a list row. */
function RowTools<T>({ i, list, set }: { i: number; list: T[]; set: (next: T[]) => void }) {
  const move = (d: number) => {
    const n = [...list];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    set(n);
  };
  const btn = "grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink disabled:opacity-30";
  return (
    <div className="flex gap-1 self-end pb-1">
      <button type="button" className={btn} onClick={() => move(-1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="size-4" /></button>
      <button type="button" className={btn} onClick={() => move(1)} disabled={i === list.length - 1} aria-label="Move down"><ArrowDown className="size-4" /></button>
      <button type="button" className={`${btn} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15`} onClick={() => set(list.filter((_, k) => k !== i))} aria-label="Remove">
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

const SOURCE_LABEL: Record<(typeof STAT_SOURCES)[number], string> = {
  custom: "My own number",
  products: "Live: number of products",
  categories: "Live: number of categories",
};

export function AboutEditor({ initial }: { initial: AboutContent }) {
  const [c, setC] = useState<AboutContent>(initial);
  const [state, action, pending] = useActionState(saveAboutContent, undefined);
  const [dirty, setDirty] = useState(false);

  function sec<K extends keyof AboutContent>(key: K): Updater<AboutContent[K]> {
    return (fn) => {
      setC((prev) => ({ ...prev, [key]: fn(prev[key]) }));
      setDirty(true);
    };
  }
  const hero = sec("hero");
  const stats = sec("stats");
  const story = sec("story");
  const values = sec("values");
  const cta = sec("cta");

  return (
    <form action={action} onSubmit={() => setDirty(false)} className="flex flex-col gap-6 pb-6">
      <input type="hidden" name="data" value={JSON.stringify(c)} />

      <Section title="Top section" hint="Heading and intro at the top of the About page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Small tag above the heading (empty = hidden)" value={c.hero.eyebrow} max={40} onChange={(v) => hero((h) => ({ ...h, eyebrow: v }))} />
          <div className="hidden sm:block" />
          <Text label="Heading" value={c.hero.title} max={120} onChange={(v) => hero((h) => ({ ...h, title: v }))} />
          <Text label="Heading highlight (colourful part)" value={c.hero.highlight} max={60} onChange={(v) => hero((h) => ({ ...h, highlight: v }))} />
          <div className="sm:col-span-2">
            <Text label="Intro text" area value={c.hero.intro} max={500} onChange={(v) => hero((h) => ({ ...h, intro: v }))} />
          </div>
        </div>
      </Section>

      <Section title="Numbers" hint="Up to 4 stat boxes. Products and categories can count themselves." toggle={<Toggle checked={c.stats.enabled} onChange={(v) => stats((s) => ({ ...s, enabled: v }))} />}>
        <div className="flex flex-col gap-3">
          {c.stats.items.map((s, i) => {
            const setItem = (patch: Partial<typeof s>) => stats((x) => ({ ...x, items: x.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) }));
            return (
              <div key={i} className="grid items-start gap-3 rounded-xl border border-line p-4 sm:grid-cols-[1fr_120px_80px_1fr_auto]">
                <label className="block">
                  <span className="label">Number from</span>
                  <select value={s.source} onChange={(e) => setItem({ source: e.target.value as typeof s.source })} className="input">
                    {STAT_SOURCES.map((src) => <option key={src} value={src}>{SOURCE_LABEL[src]}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Number</span>
                  <input type="number" min={0} step="any" disabled={s.source !== "custom"} value={s.value} onChange={(e) => setItem({ value: Number(e.target.value) || 0 })} className="input disabled:opacity-50" />
                </label>
                <Text label="Suffix" value={s.suffix} max={5} placeholder="+" onChange={(v) => setItem({ suffix: v })} />
                <Text label="Label" value={s.label} max={40} onChange={(v) => setItem({ label: v })} />
                <RowTools i={i} list={c.stats.items} set={(n) => stats((x) => ({ ...x, items: n }))} />
              </div>
            );
          })}
          {c.stats.items.length < 4 && (
            <button type="button" className="btn-outline w-fit py-2" onClick={() => stats((s) => ({ ...s, items: [...s.items, { source: "custom", value: 0, suffix: "", label: "" }] }))}>
              <Plus className="size-4" />Add number
            </button>
          )}
        </div>
      </Section>

      <Section title="Our story" hint="Text on the left, quote card on the right (empty quote = hidden)." toggle={<Toggle checked={c.story.enabled} onChange={(v) => story((s) => ({ ...s, enabled: v }))} />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Text label="Heading" value={c.story.title} max={80} onChange={(v) => story((s) => ({ ...s, title: v }))} />
          </div>
          {c.story.paragraphs.map((p, i) => (
            <div key={i} className="flex gap-2 sm:col-span-2">
              <div className="flex-1">
                <Text label={`Paragraph ${i + 1}`} area value={p} max={1000} onChange={(v) => story((s) => ({ ...s, paragraphs: s.paragraphs.map((x, k) => (k === i ? v : x)) }))} />
              </div>
              <RowTools i={i} list={c.story.paragraphs} set={(n) => story((s) => ({ ...s, paragraphs: n }))} />
            </div>
          ))}
          {c.story.paragraphs.length < 4 && (
            <button type="button" className="btn-outline w-fit py-2 sm:col-span-2" onClick={() => story((s) => ({ ...s, paragraphs: [...s.paragraphs, ""] }))}>
              <Plus className="size-4" />Add paragraph
            </button>
          )}
          <Text label="Quote" area value={c.story.quote} max={300} onChange={(v) => story((s) => ({ ...s, quote: v }))} />
          <Text label="Quote by" value={c.story.quoteBy} max={60} onChange={(v) => story((s) => ({ ...s, quoteBy: v }))} />
        </div>
      </Section>

      <Section title="Values" hint="Cards with an icon, title and short text (up to 8)." toggle={<Toggle checked={c.values.enabled} onChange={(v) => values((s) => ({ ...s, enabled: v }))} />}>
        <Text label="Heading" value={c.values.title} max={80} onChange={(v) => values((s) => ({ ...s, title: v }))} />
        <div className="flex flex-col gap-3">
          {c.values.items.map((v, i) => {
            const setItem = (patch: Partial<typeof v>) => values((x) => ({ ...x, items: x.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) }));
            return (
              <div key={i} className="grid items-start gap-3 rounded-xl border border-line p-4 sm:grid-cols-[140px_1fr_2fr_auto]">
                <label className="block">
                  <span className="label">Icon</span>
                  <select value={v.icon} onChange={(e) => setItem({ icon: e.target.value as typeof v.icon })} className="input capitalize">
                    {ABOUT_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </label>
                <Text label="Title" value={v.title} max={60} onChange={(t) => setItem({ title: t })} />
                <Text label="Text" value={v.text} max={240} onChange={(t) => setItem({ text: t })} />
                <RowTools i={i} list={c.values.items} set={(n) => values((x) => ({ ...x, items: n }))} />
              </div>
            );
          })}
          {c.values.items.length < 8 && (
            <button type="button" className="btn-outline w-fit py-2" onClick={() => values((s) => ({ ...s, items: [...s.items, { icon: "star", title: "", text: "" }] }))}>
              <Plus className="size-4" />Add value
            </button>
          )}
        </div>
      </Section>

      <Section title="Bottom call to action" hint="The box with buttons at the end of the page." toggle={<Toggle checked={c.cta.enabled} onChange={(v) => cta((s) => ({ ...s, enabled: v }))} />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Heading" value={c.cta.title} max={80} onChange={(v) => cta((s) => ({ ...s, title: v }))} />
          <Text label="Text" value={c.cta.text} max={240} onChange={(v) => cta((s) => ({ ...s, text: v }))} />
          <Text label="Main button text (empty = hidden)" value={c.cta.primaryLabel} max={40} onChange={(v) => cta((s) => ({ ...s, primaryLabel: v }))} />
          <Text label="Main button link" value={c.cta.primaryHref} max={300} placeholder="/shop" onChange={(v) => cta((s) => ({ ...s, primaryHref: v }))} />
          <Text label="Second button text (empty = hidden)" value={c.cta.secondaryLabel} max={40} onChange={(v) => cta((s) => ({ ...s, secondaryLabel: v }))} />
          <Text label="Second button link" value={c.cta.secondaryHref} max={300} placeholder="/contact" onChange={(v) => cta((s) => ({ ...s, secondaryHref: v }))} />
        </div>
      </Section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel/95 px-5 py-3 shadow-lg backdrop-blur">
        <div className="text-sm" aria-live="polite">
          {state?.error && !dirty ? (
            <span className="text-red-600 dark:text-red-300">{state.error}</span>
          ) : state?.ok && !dirty ? (
            <span className="text-emerald-600 dark:text-emerald-400">Saved. The About page is updated.</span>
          ) : dirty ? (
            <span className="text-amber-600 dark:text-amber-400">You have unsaved changes.</span>
          ) : (
            <span className="text-muted">No changes yet.</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/about" target="_blank" className="btn-outline py-2"><ExternalLink className="size-4" />View About page</Link>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface hover:text-red-600"
            onClick={async () => {
              if (!confirm("Reset the About page to the original content? Your changes will be lost.")) return;
              await resetAboutContent();
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
