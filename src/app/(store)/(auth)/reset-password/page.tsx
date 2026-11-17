"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { resetPassword } from "@/lib/actions/auth";
import { AuthShell, FormMessage } from "../auth-shell";
import { PasswordInput } from "../password-input";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [state, action, pending] = useActionState(resetPassword, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage error={state?.error} />
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="label">New password</span>
        <PasswordInput placeholder="8+ characters, with a number" autoComplete="new-password" />
      </label>
      <button disabled={pending} className="btn-primary py-2.5">{pending ? "Saving…" : "Set new password"}</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell heading="Choose a new password" sub="Links expire 30 minutes after they're sent.">
      <Suspense><ResetForm /></Suspense>
    </AuthShell>
  );
}
