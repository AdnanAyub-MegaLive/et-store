"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { syncFromMall } from "@/lib/actions/admin";

export function SyncButton() {
  const [state, action, pending] = useActionState(syncFromMall, undefined);
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <button disabled={pending} className="btn-outline py-2">
        <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Syncing…" : "Sync from Mall"}
      </button>
      {state?.ok && <p role="status" className="text-xs text-emerald-600 dark:text-emerald-400">{state.ok}</p>}
      {state?.error && <p role="alert" className="text-xs text-red-600 dark:text-red-300">{state.error}</p>}
    </form>
  );
}
