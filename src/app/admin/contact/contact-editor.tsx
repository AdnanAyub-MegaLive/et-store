"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { CONTACT_ICONS, type ContactContent } from "@/lib/contact-content-schema";
import { resetContactContent, saveContactContent } from "@/lib/actions/admin";
import { SavedToast } from "../saved-toast";

type Updater<T> = (fn: (v: T) => T) => void;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
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

export function ContactEditor({ initial }: { initial: ContactContent }) {
  const [c, setC] = useState<ContactContent>(initial);
  const [state, action, pending] = useActionState(saveContactContent, undefined);
  const [dirty, setDirty] = useState(false);

  function sec<K extends keyof ContactContent>(key: K): Updater<ContactContent[K]> {
    return (fn) => {
      setC((prev) => ({ ...prev, [key]: fn(prev[key]) }));
      setDirty(true);
    };
  }
  const hero = sec("hero");
  const form = sec("form");
  const cards = sec("cards");

  return (
    <form action={action} onSubmit={() => setDirty(false)} className="flex flex-col gap-6 pb-6">
      <SavedToast state={state} />
      <input type="hidden" name="data" value={JSON.stringify(c)} />

      <Section title="Top section" hint="Heading and intro at the top of the Contact page.">
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

      <Section title="Message form" hint="Form heading, the topics people can choose, and the thank-you text after sending.">
        <Text label="Form heading" value={c.form.title} max={80} onChange={(v) => form((f) => ({ ...f, title: v }))} />
        <div className="flex flex-col gap-2">
          <span className="label">Topics (first one is selected by default)</span>
          {c.form.topics.map((t, i) => (
            <div key={i} className="flex gap-2">
              <input value={t} maxLength={60} onChange={(e) => form((f) => ({ ...f, topics: f.topics.map((x, k) => (k === i ? e.target.value : x)) }))} className="input flex-1" />
              <RowTools i={i} list={c.form.topics} set={(n) => form((f) => ({ ...f, topics: n }))} />
            </div>
          ))}
          {c.form.topics.length < 12 && (
            <button type="button" className="btn-outline w-fit py-2" onClick={() => form((f) => ({ ...f, topics: [...f.topics, ""] }))}>
              <Plus className="size-4" />Add topic
            </button>
          )}
        </div>
        <Text label="Thank-you text after sending" area value={c.form.successText} max={240} onChange={(v) => form((f) => ({ ...f, successText: v }))} />
      </Section>

      <Section title="Info cards" hint="Cards next to the form (up to 6). Link can be /page, https://… or mailto:you@example.com.">
        <div className="flex flex-col gap-3">
          {c.cards.map((card, i) => {
            const setItem = (patch: Partial<typeof card>) => cards((list) => list.map((it, k) => (k === i ? { ...it, ...patch } : it)));
            return (
              <div key={i} className="grid items-start gap-3 rounded-xl border border-line p-4 sm:grid-cols-[130px_1fr_1fr_auto]">
                <label className="block">
                  <span className="label">Icon</span>
                  <select value={card.icon} onChange={(e) => setItem({ icon: e.target.value as typeof card.icon })} className="input capitalize">
                    {CONTACT_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </label>
                <Text label="Title" value={card.title} max={60} onChange={(v) => setItem({ title: v })} />
                <Text label="Text" value={card.text} max={240} onChange={(v) => setItem({ text: v })} />
                <RowTools i={i} list={c.cards} set={(n) => cards(() => n)} />
                <div className="hidden sm:block" />
                <Text label="Link text (optional)" value={card.linkLabel} max={80} onChange={(v) => setItem({ linkLabel: v })} />
                <Text label="Link (optional)" value={card.linkHref} max={300} placeholder="mailto:support@example.com" onChange={(v) => setItem({ linkHref: v })} />
              </div>
            );
          })}
          {c.cards.length < 6 && (
            <button type="button" className="btn-outline w-fit py-2" onClick={() => cards((list) => [...list, { icon: "mail", title: "", text: "", linkLabel: "", linkHref: "" }])}>
              <Plus className="size-4" />Add card
            </button>
          )}
        </div>
      </Section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel/95 px-5 py-3 shadow-lg backdrop-blur">
        <div className="text-sm" aria-live="polite">
          {state?.error && !dirty ? (
            <span className="text-red-600 dark:text-red-300">{state.error}</span>
          ) : state?.ok && !dirty ? (
            <span className="text-emerald-600 dark:text-emerald-400">Saved. The Contact page is updated.</span>
          ) : dirty ? (
            <span className="text-amber-600 dark:text-amber-400">You have unsaved changes.</span>
          ) : (
            <span className="text-muted">No changes yet.</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/contact" target="_blank" className="btn-outline py-2"><ExternalLink className="size-4" />View Contact page</Link>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface hover:text-red-600"
            onClick={async () => {
              if (!confirm("Reset the Contact page to the original content? Your changes will be lost.")) return;
              await resetContactContent();
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
