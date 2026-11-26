import { syncMegaProducts } from "@/lib/mega-sync";
import { revalidatePath } from "next/cache";

// Scheduled sync (e.g. Vercel Cron). Requires Authorization: Bearer $CRON_SECRET.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await syncMegaProducts();
    if (result.removed || result.renamed) revalidatePath("/", "layout");
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 502 });
  }
}
