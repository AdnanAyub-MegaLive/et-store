"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { FormMessage } from "../auth-shell";
import { PasswordInput } from "../password-input";

export function LoginForm({ next, reset }: { next: string; reset: boolean }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage error={state?.error} ok={reset ? "Password updated. Sign in with your new password." : undefined} />
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="label">Email address</span>
        <input name="email" type="email" required autoComplete="email" maxLength={254} className="input h-11" />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <PasswordInput />
      </label>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="remember" className="size-4 accent-brand" />Remember me</label>
        <Link href="/forgot-password" className="font-medium text-brand">Forgot password?</Link>
      </div>
      <button disabled={pending} className="btn-primary py-2.5">{pending ? "Signing in…" : "Sign in"}</button>
      <p className="text-center text-sm text-muted">
        New to ET-Store? <Link href="/register" className="font-medium text-brand">Create an account</Link>
      </p>
    </form>
  );
}
