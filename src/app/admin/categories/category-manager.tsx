"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { categoryIcons, iconFor } from "@/components/icons";
import { deleteCategory, moveCategory, saveCategory } from "@/lib/actions/admin";

type Cat = { id: string; name: string; slug: string; icon: string; products: number };

const tile = "grid place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white";

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="label">Icon</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category icon">
        {Object.entries(categoryIcons).map(([key, Icon]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            aria-label={key}
            title={key}
            onClick={() => onChange(key)}
            className={`grid size-10 place-items-center rounded-xl border-2 transition ${value === key ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:border-brand/50 hover:text-ink"}`}
          >
            <Icon className="size-5" />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Add form (no category) or edit form (with category). */
function CategoryForm({ category, onDone }: { category?: Cat; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveCategory, undefined);
  const [icon, setIcon] = useState(category?.icon ?? "frame");
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border border-brand/30 bg-brand-soft/20 p-4">
      <input type="hidden" name="id" value={category?.id ?? ""} />
      <input type="hidden" name="icon" value={icon} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Name</span>
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} placeholder="e.g. Stickers" className="input" autoFocus />
        </label>
        <label className="block">
          <span className="label">Slug (used in the link)</span>
          <input
            name="slug"
            value={slugTouched ? slug : autoSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            maxLength={60}
            placeholder="stickers"
            className="input"
          />
        </label>
      </div>
      <IconPicker value={icon} onChange={setIcon} />
      {state?.error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{state.error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className="btn-primary py-2">{pending ? "Saving…" : category ? "Save category" : "Add category"}</button>
        <button type="button" onClick={onDone} className="btn-outline py-2"><X className="size-4" />Cancel</button>
      </div>
    </form>
  );
}

function DeleteCategory({ c }: { c: Cat }) {
  const [state, action, pending] = useActionState(deleteCategory, undefined);
  const locked = c.products > 0;
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete the "${c.name}" category? This cannot be undone.`)) e.preventDefault();
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={c.id} />
      <button
        disabled={pending || locked}
        title={locked ? `Has ${c.products} product${c.products === 1 ? "" : "s"}. Move or delete them first.` : "Delete category"}
        className="grid size-8 place-items-center rounded-lg text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40 disabled:hover:bg-transparent dark:text-red-400 dark:hover:bg-red-500/15"
        aria-label={`Delete ${c.name}`}
      >
        <Trash2 className="size-4" />
      </button>
      {state?.error && <span role="alert" className="ml-2 text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const [editing, setEditing] = useState<string | null>(null); // category id, "new", or null
  const close = () => setEditing(null);
  const btn = "grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink disabled:opacity-30";

  return (
    <div className="card flex flex-col gap-3 p-4 sm:p-6">
      {categories.map((c, i) => {
        const Icon = iconFor(c.icon);
        if (editing === c.id) return <CategoryForm key={c.id} category={c} onDone={close} />;
        return (
          <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-4 py-3">
            <span className={`${tile} size-9`}><Icon className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted">
                /{c.slug} ·{" "}
                <Link href={`/shop?category=${c.slug}`} target="_blank" className="hover:text-brand hover:underline">
                  {c.products} product{c.products === 1 ? "" : "s"}
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-1">
              <form action={moveCategory} className="inline">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="dir" value="up" />
                <button className={btn} disabled={i === 0} aria-label={`Move ${c.name} up`}><ArrowUp className="size-4" /></button>
              </form>
              <form action={moveCategory} className="inline">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="dir" value="down" />
                <button className={btn} disabled={i === categories.length - 1} aria-label={`Move ${c.name} down`}><ArrowDown className="size-4" /></button>
              </form>
              <button type="button" className={`${btn} hover:text-brand`} onClick={() => setEditing(c.id)} aria-label={`Edit ${c.name}`}><Pencil className="size-4" /></button>
              <DeleteCategory c={c} />
            </div>
          </div>
        );
      })}

      {categories.length === 0 && <p className="py-6 text-center text-muted">No categories yet.</p>}

      {editing === "new" ? (
        <CategoryForm onDone={close} />
      ) : (
        <button type="button" onClick={() => setEditing("new")} className="btn-primary mt-2 w-fit py-2">
          <Plus className="size-4" />Add category
        </button>
      )}
    </div>
  );
}
