import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR, UPLOAD_NAME, UPLOAD_TYPES, blobToken, type UploadExt } from "@/lib/uploads";

/** Local disk first; on Vercel, the private Blob store. */
async function readUpload(name: string): Promise<Uint8Array> {
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

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!UPLOAD_NAME.test(name)) return new Response("Not found", { status: 404 });
  try {
    const body = await readUpload(name);
    const ext = name.split(".").pop() as UploadExt;
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": UPLOAD_TYPES[ext],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        // Even if an SVG is opened directly, nothing inside it can run.
        "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
