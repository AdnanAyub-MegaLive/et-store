import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cols } from "./db";

const COOKIE = "lm_session";

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { sub: string; role: "USER" | "ADMIN" };

export async function createSession(userId: string, role: "USER" | "ADMIN", remember = false) {
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE);
}

export async function verifyToken(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return { sub: payload.sub, role: payload.role === "ADMIN" ? "ADMIN" : "USER" };
  } catch {
    return null;
  }
}

/** Current user, re-read from the DB so role changes / deletions take effect immediately. */
export const getCurrentUser = cache(async () => {
  const session = await verifyToken((await cookies()).get(COOKIE)?.value);
  if (!session) return null;
  const u = await (await cols()).users.findOne({ _id: session.sub }, { projection: { email: 1, name: 1, role: 1, createdAt: 1 } });
  return u ? { id: u._id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt } : null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");
  return user;
}

export const SESSION_COOKIE = COOKIE;
