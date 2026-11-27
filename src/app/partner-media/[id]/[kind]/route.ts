import { fetchPartnerMedia } from "@/lib/partner";

/** Serves Mall previews from our own domain, so signed links never expire in the browser. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  if ((kind !== "image" && kind !== "motion") || !/^[\w-]{1,64}$/.test(id)) return new Response("Not found", { status: 404 });
  try {
    const res = await fetchPartnerMedia(id, kind);
    if (!res) return new Response("Not found", { status: 404 });
    if (!res.ok || !res.body) {
      const retry = res.headers.get("retry-after");
      return new Response("Preview unavailable", { status: res.status === 503 ? 503 : 404, headers: retry ? { "Retry-After": retry } : {} });
    }
    return new Response(res.body, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? (kind === "image" ? "image/webp" : "video/mp4"),
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Preview unavailable", { status: 502 });
  }
}
