import type { Metadata } from "next";
import { AuthShell } from "../auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  return (
    <AuthShell heading="Welcome back" sub="Sign in to continue to ET-Store.">
      <LoginForm next={sp.next ?? ""} reset={sp.reset === "1"} />
    </AuthShell>
  );
}
