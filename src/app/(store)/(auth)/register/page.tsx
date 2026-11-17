"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/lib/actions/auth";
import { AuthShell, FormMessage } from "../auth-shell";
import { PasswordInput } from "../password-input";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined);
  return (
    <AuthShell heading="Create your account" sub="Join 12k+ creators building with ET-Store.">
      <form action={action} className="flex flex-col gap-4">
        <FormMessage error={state?.error} />
        <label className="block">
          <span className="label">Full name</span>
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" className="input h-11" />
        </label>
        <label className="block">
          <span className="label">Email address</span>
          <input name="email" type="email" required maxLength={254} autoComplete="email" className="input h-11" />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <PasswordInput placeholder="8+ characters, with a number" autoComplete="new-password" />
        </label>
        <button disabled={pending} className="btn-primary py-2.5">{pending ? "Creating account…" : "Create account"}</button>
        <p className="text-center text-sm text-muted">
          Already have an account? <Link href="/login" className="font-medium text-brand">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
