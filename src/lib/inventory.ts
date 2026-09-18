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
