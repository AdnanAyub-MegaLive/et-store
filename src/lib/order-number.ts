import type { PrismaClient } from "@prisma/client";

/** Next order number (MongoDB has no autoincrement). Atomic: one counter document, incremented in place. */
export async function nextOrderNumber(db: PrismaClient): Promise<number> {
  const c = await db.counter.upsert({ where: { id: "order" }, create: { id: "order", value: 1001 }, update: { value: { increment: 1 } } });
  return c.value;
}
