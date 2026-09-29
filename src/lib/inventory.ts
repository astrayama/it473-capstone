import "server-only";
import { db } from "@/lib/db";
import type { InventoryItem } from "@/generated/prisma/client";

export type { InventoryItem };

export type StockLevel = "in_stock" | "low" | "out";

export function stockLevel(item: InventoryItem | undefined): StockLevel {
  if (!item || item.quantityOnHand <= 0) return "out";
  if (item.quantityOnHand <= item.reorderPoint) return "low";
  return "in_stock";
}

export async function listInventory(): Promise<InventoryItem[]> {
  return db().inventoryItem.findMany({ orderBy: { sku: "asc" } });
}

export async function getInventoryMap(productIds?: string[]): Promise<Map<string, InventoryItem>> {
  const rows = await db().inventoryItem.findMany(
    productIds ? { where: { productId: { in: productIds } } } : undefined,
  );
  return new Map(rows.map((r) => [r.productId, r]));
}

/**
 * Storefront variant of getInventoryMap: resolves to null instead of throwing (or hanging)
 * when Cloud SQL is unavailable, so catalog pages still render from Firestore with the
 * stock badge hidden. "No row" (-> out of stock) is different from null ("unknown").
 */
export async function tryGetInventoryMap(
  productIds: string[],
  timeoutMs = 1500,
): Promise<Map<string, InventoryItem> | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  try {
    return await Promise.race([getInventoryMap(productIds), timeout]);
  } catch (err) {
    console.warn("Inventory unavailable, showing catalog without stock:", (err as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function upsertInventory(
  productId: string,
  sku: string,
  data: { quantityOnHand?: number; reorderPoint?: number; binLocation?: string | null },
): Promise<InventoryItem> {
  return db().inventoryItem.upsert({
    where: { productId },
    create: { productId, sku, ...data },
    update: { sku, ...data },
  });
}

export async function deleteInventory(productId: string): Promise<void> {
  await db().inventoryItem.deleteMany({ where: { productId } });
}

export async function lowStockCount(): Promise<number> {
  const rows = await db().inventoryItem.findMany({
    select: { quantityOnHand: true, reorderPoint: true },
  });
  return rows.filter((r) => r.quantityOnHand <= r.reorderPoint).length;
}
