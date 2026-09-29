import { NextResponse } from "next/server";
import { handleRouteError, jsonError, requireAdminApi } from "@/lib/api";
import { productCreateSchema } from "@/lib/validation";
import { createProduct } from "@/lib/catalog";
import { listCategories } from "@/lib/categories";
import { upsertInventory } from "@/lib/inventory";
import { normalizeSkuToId } from "@/lib/sku";

/** Add a product: catalog fields -> Firestore `catalog/{sku-id}`, stock fields -> Cloud SQL. */
export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;

    const { sku, quantityOnHand, reorderPoint, binLocation, ...catalog } = productCreateSchema.parse(await req.json());
    const id = normalizeSkuToId(sku);
    if (!id) return jsonError(400, "Use a SKU made of letters, numbers and dashes, e.g. 4001 or SKU-4001.");
    const categories = await listCategories();
    if (!categories.some((c) => c.id === catalog.category)) return jsonError(400, "Choose one of the catalog's categories.");

    const product = await createProduct(id, catalog);
    let stockSaved = true;
    try {
      await upsertInventory(product.id, product.sku, { quantityOnHand, reorderPoint, binLocation });
    } catch (err) {
      console.error("Stock not saved:", err);
      stockSaved = false;
    }
    return NextResponse.json(
      { product, stockSaved, ...(stockSaved ? {} : { warning: "Product saved, but stock wasn't: the stock database is unavailable." }) },
      { status: 201 },
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
