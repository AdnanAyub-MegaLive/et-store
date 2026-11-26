"use client";

/** Ticks or clears every item checkbox in the Mega catalog form. */
export function SelectAll({ form }: { form: string }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input
        type="checkbox"
        className="size-4 accent-[var(--color-brand,#6d28d9)]"
        onChange={(e) => document.querySelectorAll<HTMLInputElement>(`#${form} input[name="id"]`).forEach((c) => { c.checked = e.currentTarget.checked; })}
      />
      Select all shown
    </label>
  );
}
