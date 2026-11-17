import "server-only";
import { headers } from "next/headers";

// In-memory fixed-window limiter. Fine for a single instance; swap for Redis when scaling out.
const hits = new Map<string, { count: number; reset: number }>();

export async function rateLimit(bucket: string, limit: number, windowMs: number) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const k = `${bucket}:${ip}`;
  const now = Date.now();
  const entry = hits.get(k);
  if (!entry || entry.reset < now) {
    hits.set(k, { count: 1, reset: now + windowMs });
    if (hits.size > 10_000) for (const [key, v] of hits) if (v.reset < now) hits.delete(key);
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}
