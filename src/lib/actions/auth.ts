"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { cols, fromDoc, isDuplicateKey, newId, type User } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export type FormState = { error?: string; ok?: string } | undefined;

const email = z.string().trim().toLowerCase().email("Enter a valid email").max(254);
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Password needs a letter")
  .regex(/[0-9]/, "Password needs a number");

// Pre-computed hash so login timing is the same whether or not the user exists.
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer-not-a-password", 12);

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : null;
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("login", 10, 15 * 60_000))) return { error: "Too many attempts. Try again in 15 minutes." };
  const parsed = z
    .object({ email, password: z.string().min(1).max(128) })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Invalid email or password" };

  const user = fromDoc<User>(await (await cols()).users.findOne({ email: parsed.data.email }));
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "Invalid email or password" };

  await createSession(user.id, user.role, form.get("remember") === "on");
  redirect(safeNext(form.get("next")) ?? (user.role === "ADMIN" ? "/admin" : "/account"));
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("register", 5, 60 * 60_000))) return { error: "Too many sign-ups from this network. Try later." };
  const parsed = z
    .object({ name: z.string().trim().min(2, "Enter your name").max(80), email, password })
    .safeParse({ name: form.get("name"), email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { users } = await cols();
  const exists = await users.findOne({ email: parsed.data.email }, { projection: { _id: 1 } });
  if (exists) return { error: "An account with that email already exists" };

  const now = new Date();
  const user = { id: newId(), role: "USER" as const };
  try {
    await users.insertOne({
      _id: user.id,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      role: user.role,
      createdAt: now,
      updatedAt: now,
    });
  } catch (e) {
    if (isDuplicateKey(e)) return { error: "An account with that email already exists" };
    throw e;
  }
  await createSession(user.id, user.role);
  redirect("/account");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("forgot", 5, 60 * 60_000))) return { error: "Too many requests. Try again later." };
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { error: "Enter a valid email" };

  const { users, resetTokens } = await cols();
  const user = await users.findOne({ email: parsed.data }, { projection: { _id: 1 } });
  if (user) {
    const token = randomBytes(32).toString("base64url");
    await resetTokens.insertOne({
      _id: newId(),
      userId: user._id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 30 * 60_000),
      usedAt: null,
      createdAt: new Date(),
    });
    const link = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    // TODO: send `link` with your email provider (Resend, SES, ...). Logged only in development.
    if (process.env.NODE_ENV !== "production") console.info("[password reset]", link);
  }
  // Same response either way so emails can't be enumerated.
  return { ok: "If an account exists for that email, a reset link is on its way." };
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({ token: z.string().min(20).max(200), password })
    .safeParse({ token: form.get("token"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const { users, resetTokens } = await cols();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  // Claim the token atomically (single use), then set the new password.
  const record = await resetTokens.findOneAndUpdate({ tokenHash, usedAt: null, expiresAt: { $gt: new Date() } }, { $set: { usedAt: new Date() } });
  if (!record) return { error: "This reset link is invalid or has expired" };
  await users.updateOne({ _id: record.userId }, { $set: { passwordHash, updatedAt: new Date() } });
  redirect("/login?reset=1");
}
