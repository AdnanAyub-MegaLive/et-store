"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import type { HomeContent } from "@/lib/home-content-schema";
import { resetHomeContent, saveHomeContent } from "@/lib/actions/admin";
import { ImageField } from "../products/[id]/image-field";

type Updater<T> = (fn: (v: T) => T) => void;
type ListFn = <T>(arr: T[]) => T[];

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
        <textarea value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} rows={3} placeholder={placeholder} className="input" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} placeholder={placeholder} className="input" />
      )}
    </label>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-brand" />
      Show on home page
    </label>
  );
}

/** Move up / move down / remove buttons for a list row. */
function RowTools({ i, len, set }: { i: number; len: number; set: (fn: ListFn) => void }) {
  const move = (d: number) =>
    set(<T,>(arr: T[]) => {
      const n = [...arr];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });
  const btn = "grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink disabled:opacity-30";
  return (
    <div className="flex gap-1">
      <button type="button" className={btn} onClick={() => move(-1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="size-4" /></button>
      <button type="button" className={btn} onClick={() => move(1)} disabled={i === len - 1} aria-label="Move down"><ArrowDown className="size-4" /></button>
      <button type="button" className={`${btn} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15`} onClick={() => set(<T,>(arr: T[]) => arr.filter((_, k) => k !== i))} aria-label="Remove">
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export function HomeEditor({ initial }: { initial: HomeContent }) {
  const [c, setC] = useState<HomeContent>(initial);
  const [state, action, pending] = useActionState(saveHomeContent, undefined);
  const [dirty, setDirty] = useState(false);
  // Bumped when list rows move or are removed, so image fields re-read their value.
  const [rev, setRev] = useState(0);

  /** Update one section immutably. */
  function sec<K extends keyof HomeContent>(key: K): Updater<HomeContent[K]> {
    return (fn) => {
      setC((prev) => ({ ...prev, [key]: fn(prev[key]) }));
      setDirty(true);
    };
  }
  const hero = sec("hero");
  const clients = sec("clients");
  const promo = sec("promo");
  const how = sec("howItWorks");
  const tst = sec("testimonials");
  const news = sec("newsletter");

  return (
    <form action={action} onSubmit={() => setDirty(false)} className="flex flex-col gap-6 pb-6">
      <input type="hidden" name="data" value={JSON.stringify(c)} />

      <Section title="Hero" hint="The big banner at the top of the home page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Small tag above the heading (empty = hidden)" value={c.hero.badge} max={60} onChange={(v) => hero((h) => ({ ...h, badge: v }))} />
          <div className="hidden sm:block" />
          <Text label="Heading" value={c.hero.title} max={120} onChange={(v) => hero((h) => ({ ...h, title: v }))} />
          <Text label="Heading highlight (colourful part)" value={c.hero.highlight} max={60} onChange={(v) => hero((h) => ({ ...h, highlight: v }))} />
          <div className="sm:col-span-2">
            <Text label="Text under the heading" area value={c.hero.subtitle} max={300} onChange={(v) => hero((h) => ({ ...h, subtitle: v }))} />
          </div>
          <Text label="Main button text" value={c.hero.primaryLabel} max={40} onChange={(v) => hero((h) => ({ ...h, primaryLabel: v }))} />
          <Text label="Main button link" value={c.hero.primaryHref} max={300} placeholder="/shop" onChange={(v) => hero((h) => ({ ...h, primaryHref: v }))} />
          <Text label="Second button text (empty = hidden)" value={c.hero.secondaryLabel} max={40} onChange={(v) => hero((h) => ({ ...h, secondaryLabel: v }))} />
          <Text label="Second button link" value={c.hero.secondaryHref} max={300} placeholder="#categories" onChange={(v) => hero((h) => ({ ...h, secondaryHref: v }))} />
          {[0, 1, 2].map((i) => (
            <Text
              key={i}
              label={`Point ${i + 1} (empty = hidden)`}
              value={c.hero.points[i] ?? ""}
              max={60}
              onChange={(v) =>
                hero((h) => {
                  const p = [...h.points];
                  while (p.length <= i) p.push("");
                  p[i] = v;
                  return { ...h, points: p };
                })
              }
            />
          ))}
          <div className="hidden sm:block" />
          <ImageField name="" label="Hero image" initial={c.hero.image} onChange={(v) => hero((h) => ({ ...h, image: v }))} />
          <label className="block">
            <span className="label">Stat number</span>
            <input type="number" min={0} value={c.hero.statValue} onChange={(e) => hero((h) => ({ ...h, statValue: Number(e.target.value) || 0 }))} className="input" />
          </label>
          <Text label="Stat suffix (e.g. +)" value={c.hero.statSuffix} max={5} onChange={(v) => hero((h) => ({ ...h, statSuffix: v }))} />
          <Text label="Stat label (empty = hidden)" value={c.hero.statLabel} max={40} onChange={(v) => hero((h) => ({ ...h, statLabel: v }))} />
        </div>
      </Section>

      <Section title="Client logos" hint="The scrolling strip of logos under the hero." toggle={<Toggle checked={c.clients.enabled} onChange={(v) => clients((s) => ({ ...s, enabled: v }))} />}>
        <div className="flex flex-col gap-4">
          {c.clients.items.map((item, i) => (
            <div key={`${rev}-${i}`} className="grid items-start gap-3 rounded-xl border border-line p-4 sm:grid-cols-[200px_1fr_auto]">
              <Text label="Client name" value={item.name} max={60} onChange={(v) => clients((s) => ({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, name: v } : x)) }))} />
              <ImageField name="" label="Logo" initial={item.logo} onChange={(v) => clients((s) => ({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, logo: v } : x)) }))} />
              <RowTools
                i={i}
                len={c.clients.items.length}
                set={(fn) => {
                  clients((s) => ({ ...s, items: fn(s.items) }));
                  setRev((r) => r + 1);
                }}
              />
            </div>
          ))}
          {c.clients.items.length < 20 && (
            <button type="button" className="btn-outline w-fit py-2" onClick={() => clients((s) => ({ ...s, items: [...s.items, { name: "New client", logo: "" }] }))}>
              <Plus className="size-4" />Add logo
            </button>
          )}
        </div>
      </Section>

      <Section title="Section headings">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Categories heading" value={c.categories.title} max={80} onChange={(v) => sec("categories")((s) => ({ ...s, title: v }))} />
          <Text label="Trending products heading" value={c.trending.title} max={80} onChange={(v) => sec("trending")((s) => ({ ...s, title: v }))} />
        </div>
      </Section>

      <Section title="Promo banner" hint="The colourful offer banner." toggle={<Toggle checked={c.promo.enabled} onChange={(v) => promo((s) => ({ ...s, enabled: v }))} />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Heading" value={c.promo.title} max={100} onChange={(v) => promo((s) => ({ ...s, title: v }))} />
          <Text label="Sticker, e.g. −25% (empty = hidden)" value={c.promo.tag} max={12} onChange={(v) => promo((s) => ({ ...s, tag: v }))} />
          <div className="sm:col-span-2">
            <Text label="Text" value={c.promo.text} max={200} onChange={(v) => promo((s) => ({ ...s, text: v }))} />
          </div>
          <Text label="Button text" value={c.promo.buttonLabel} max={40} onChange={(v) => promo((s) => ({ ...s, buttonLabel: v }))} />
          <Text label="Button link" value={c.promo.buttonHref} max={300} placeholder="/shop" onChange={(v) => promo((s) => ({ ...s, buttonHref: v }))} />
        </div>
      </Section>

      <Section title="How it works" hint="The three-step section.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Small heading" value={c.howItWorks.eyebrow} max={40} onChange={(v) => how((s) => ({ ...s, eyebrow: v }))} />
          <Text label="Heading" value={c.howItWorks.title} max={100} onChange={(v) => how((s) => ({ ...s, title: v }))} />
          {c.howItWorks.steps.map((step, i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-line p-4 sm:col-span-2 sm:grid-cols-[1fr_2fr]">
              <Text label={`Step ${i + 1} title`} value={step.title} max={60} onChange={(v) => how((s) => ({ ...s, steps: s.steps.map((x, k) => (k === i ? { ...x, title: v } : x)) }))} />
              <Text label={`Step ${i + 1} text`} value={step.text} max={200} onChange={(v) => how((s) => ({ ...s, steps: s.steps.map((x, k) => (k === i ? { ...x, text: v } : x)) }))} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Testimonials" hint="Customer quotes. Only use real quotes from real customers." toggle={<Toggle checked={c.testimonials.enabled} onChange={(v) => tst((s) => ({ ...s, enabled: v }))} />}>
        <Text label="Heading" value={c.testimonials.title} max={80} onChange={(v) => tst((s) => ({ ...s, title: v }))} />
        <div className="flex flex-col gap-4">
          {c.testimonials.items.map((t, i) => (
            <div key={`${rev}-${i}`} className="grid items-start gap-3 rounded-xl border border-line p-4 sm:grid-cols-[1fr_auto]">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Text label="Quote" area value={t.quote} max={400} onChange={(v) => tst((s) => ({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, quote: v } : x)) }))} />
                </div>
                <Text label="Name" value={t.name} max={60} onChange={(v) => tst((s) => ({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, name: v } : x)) }))} />
                <Text label="Role (optional)" value={t.role} max={60} onChange={(v) => tst((s) => ({ ...s, items: s.items.map((x, k) => (k === i ? { ...x, role: v } : x)) }))} />
              </div>
              <RowTools
                i={i}
                len={c.testimonials.items.length}
                set={(fn) => {
                  tst((s) => ({ ...s, items: fn(s.items) }));
                  setRev((r) => r + 1);
                }}
              />
            </div>
          ))}
          {c.testimonials.items.length < 6 && (
            <button type="button" className="btn-outline w-fit py-2" onClick={() => tst((s) => ({ ...s, items: [...s.items, { quote: "", name: "", role: "" }] }))}>
              <Plus className="size-4" />Add testimonial
            </button>
          )}
        </div>
      </Section>

      <Section title="Newsletter" hint="The sign-up box at the bottom.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Heading" value={c.newsletter.title} max={80} onChange={(v) => news((s) => ({ ...s, title: v }))} />
          <Text label="Text" value={c.newsletter.text} max={200} onChange={(v) => news((s) => ({ ...s, text: v }))} />
        </div>
      </Section>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel/95 px-5 py-3 shadow-lg backdrop-blur">
        <div className="text-sm" aria-live="polite">
          {state?.error && !dirty ? (
            <span className="text-red-600 dark:text-red-300">{state.error}</span>
          ) : state?.ok && !dirty ? (
            <span className="text-emerald-600 dark:text-emerald-400">Saved. The home page is updated.</span>
          ) : dirty ? (
            <span className="text-amber-600 dark:text-amber-400">You have unsaved changes.</span>
          ) : (
            <span className="text-muted">No changes yet.</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" target="_blank" className="btn-outline py-2"><ExternalLink className="size-4" />View home page</Link>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface hover:text-red-600"
            onClick={async () => {
              if (!confirm("Reset the whole home page to the original content? Your changes will be lost.")) return;
              await resetHomeContent();
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
