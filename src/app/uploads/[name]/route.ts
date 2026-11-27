import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR, UPLOAD_NAME, UPLOAD_TYPES, blobToken, type UploadExt } from "@/lib/uploads";
import { cols } from "@/lib/db";

/** MongoDB first, then older files on local disk, then a private Blob store. */
async function readUpload(name: string): Promise<Uint8Array> {
  const doc = await (await cols()).uploads.findOne({ _id: name });
  if (doc) return new Uint8Array(doc.data.buffer);
  try {
    return await readFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name));
  } catch (e) {
    const token = blobToken();
    if (!token) throw e;
    const { get } = await import("@vercel/blob");
    const r = await get(`uploads/${name}`, { access: "private", token });
    if (!r || r.statusCode !== 200) throw e;
    return new Uint8Array(await new Response(r.stream).arrayBuffer());
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!UPLOAD_NAME.test(name)) return new Response("Not found", { status: 404 });
  try {
    const body = await readUpload(name);
    const ext = name.split(".").pop() as UploadExt;
    const headers: Record<string, string> = {
      "Content-Type": UPLOAD_TYPES[ext],
      "Cache-Control": "public, max-age=31536000, immutable, s-maxage=31536000",
      // Files never change (random names), so Vercel's CDN can keep them; it then answers range requests itself.
      "CDN-Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
      // Even if an SVG is opened directly, nothing inside it can run.
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox",
    };
    // Videos need byte ranges (Safari won't play without them; seeking uses them everywhere).
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
    // "bytes=0-" asks for the whole file: answer 200 so the CDN can cache it.
    if (m && (m[1] || m[2]) && !(m[1] === "0" && !m[2])) {
      const size = body.length;
      let start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
      let end = m[1] && m[2] ? Number(m[2]) : size - 1;
      end = Math.min(end, size - 1);
      start = Math.min(start, end);
      if (start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      return new Response(body.slice(start, end + 1), { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
    }
    return new Response(new Uint8Array(body), { headers: { ...headers, "Content-Length": String(body.length) } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
