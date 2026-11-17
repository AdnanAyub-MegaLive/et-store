"use client";

import { useActionState } from "react";
import { subscribe } from "@/lib/actions/store";

export function NewsletterForm({ large = false }: { large?: boolean }) {
  const [state, action, pending] = useActionState(subscribe, undefined);
  return (
    <div className={large ? "w-full max-w-[448px]" : "w-full"}>
      <form action={action} className="flex items-center rounded-xl border border-line bg-page p-1.5">
        <input
          type="email"
          name="email"
          required
          maxLength={254}
          placeholder="Email address"
          aria-label="Email address"
          className={`min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted ${large ? "h-10" : "h-9"}`}
        />
        <button disabled={pending} className={`rounded-[9px] bg-brand py-2 text-sm font-medium text-on-brand hover:bg-brand/90 ${large ? "px-4" : "px-3"}`}>
          Subscribe
        </button>
      </form>
      {state?.ok && <p className="mt-2 text-xs text-brand">{state.ok}</p>}
      {state?.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
