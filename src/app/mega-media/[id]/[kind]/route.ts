import { megaItem, megaMedia } from "@/lib/mega";

// Serves Mega Mall artwork from this site: looks up a fresh signed link from the
// portal and streams the bytes, so pages never hold links that expire.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || (kind !== "image" && kind !== "motion")) return new Response("Not found", { status: 404 });
  let item;
  try { item = await megaItem(id); } catch { return new Response("Mega catalog unavailable", { status: 502 }); }
  const url = item?.media[kind];
  if (!url) return new Response("Not found", { status: 404 });
  let upstream: Response;
  try { upstream = await megaMedia(url); } catch { return new Response("Mega media unavailable", { status: 502 }); }
  if (!upstream.ok || !upstream.body) return new Response("Mega media unavailable", { status: upstream.status === 404 ? 404 : 502 });
  const type = upstream.headers.get("content-type") ?? "application/octet-stream";
  if (!/^(image|video)\//.test(type)) return new Response("Unsupported media", { status: 502 });
  return new Response(upstream.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
