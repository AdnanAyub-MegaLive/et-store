import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// Only the buyer of a PAID order can download. Wire `product.fileKey` to private storage (S3 signed URL) here.
export async function GET(_: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { itemId } = await params;
  const item = await db.orderItem.findFirst({
    where: { id: itemId, order: { userId: user.id, status: "PAID" } },
    include: { product: { select: { name: true, slug: true } } },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(`Thanks for purchasing ${item.product.name}.\nThe real file will be served here once storage is connected.\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${item.product.slug}.txt"`,
      "Cache-Control": "private, no-store",
    },
  });
}
