"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";
import { AuthShell, FormMessage } from "../auth-shell";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  return (
    <AuthShell heading="Forgot your password?" sub="Enter your email and we'll send you a link to reset it.">
      <form action={action} className="flex flex-col gap-4">
        <FormMessage error={state?.error} ok={state?.ok} />
        <label className="block">
          <span className="label">Email address</span>
          <input name="email" type="email" required maxLength={254} autoComplete="email" className="input h-11" />
        </label>
        <button disabled={pending} className="btn-primary py-2.5">{pending ? "Sending…" : "Send reset link"}</button>
        <Link href="/login" className="text-center text-sm font-medium text-brand">Back to sign in</Link>
      </form>
    </AuthShell>
  );
}
