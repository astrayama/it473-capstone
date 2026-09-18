import { NextResponse } from "next/server";
import { handleRouteError, jsonError, requireAdminApi } from "@/lib/api";
import { productSchema } from "@/lib/validation";
import { createProduct } from "@/lib/catalog";
import { upsertInventory } from "@/lib/inventory";
import { db } from "@/lib/db";

/** Add a product: catalog fields -> Firestore, stock fields -> Cloud SQL. */
export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;

    const { quantityOnHand, reorderPoint, binLocation, ...catalog } = productSchema.parse(await req.json());
    const skuTaken = await db().inventoryItem.findUnique({ where: { sku: catalog.sku } });
    if (skuTaken) return jsonError(409, `SKU ${catalog.sku} is already used by another product.`);

    const product = await createProduct(catalog);
    await upsertInventory(product.id, product.sku, { quantityOnHand, reorderPoint, binLocation });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
