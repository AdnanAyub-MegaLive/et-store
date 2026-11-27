import "server-only";
import { cols } from "@/lib/db";
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
  const { products } = await cols();
  const linked = (
    await products.find({ megaItemId: { $type: "string" } }, { projection: { name: 1, megaItemId: 1, megaName: 1, megaRemovedAt: 1 } }).toArray()
  ).map(({ _id, ...p }) => ({ id: _id, ...p }));
  const result: MegaSyncResult = { removed: 0, restored: 0, renamed: 0 };
  const now = new Date();
  for (const p of linked) {
    const item = byId.get(p.megaItemId!);
    if (!item) {
      if (!p.megaRemovedAt) {
        await products.updateOne({ _id: p.id }, { $set: { published: false, megaRemovedAt: now, updatedAt: now } });
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
    await products.updateOne({ _id: p.id }, { $set: { ...data, updatedAt: now } });
  }
  return result;
}
