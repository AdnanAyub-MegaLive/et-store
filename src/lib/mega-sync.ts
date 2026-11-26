import "server-only";
import { db } from "@/lib/db";
import { megaCatalog, type MegaItem } from "@/lib/mega";

export type MegaSyncResult = { removed: number; restored: number; renamed: number };

/**
 * Bring imported products in line with the Mega Mall:
 * - an item that left the Mall is unpublished and marked removed;
 * - an item that came back is unmarked (the admin decides when to republish);
 * - the product name follows Mega unless an admin renamed it.
 */
export async function syncMegaProducts(items?: MegaItem[]): Promise<MegaSyncResult> {
  const catalog = items ?? (await megaCatalog({ fresh: true }));
  const byId = new Map(catalog.map((i) => [i.id, i]));
  const linked = await db.product.findMany({
    where: { megaItemId: { not: null } },
    select: { id: true, name: true, megaItemId: true, megaName: true, megaRemovedAt: true },
  });
  const result: MegaSyncResult = { removed: 0, restored: 0, renamed: 0 };
  const now = new Date();
  for (const p of linked) {
    const item = byId.get(p.megaItemId!);
    if (!item) {
      if (!p.megaRemovedAt) {
        await db.product.update({ where: { id: p.id }, data: { published: false, megaRemovedAt: now } });
        result.removed++;
      }
      continue;
    }
    const data: Record<string, unknown> = {
      megaName: item.name,
      megaCategory: item.category?.label ?? null,
      megaUpdatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
    };
    if (p.megaRemovedAt) { data.megaRemovedAt = null; result.restored++; }
    if (item.name !== p.megaName && p.name === p.megaName) { data.name = item.name; result.renamed++; }
    await db.product.update({ where: { id: p.id }, data });
  }
  return result;
}
