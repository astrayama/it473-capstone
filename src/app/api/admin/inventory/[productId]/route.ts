import { NextResponse } from "next/server";
import { handleRouteError, jsonError, requireAdminApi } from "@/lib/api";
import { inventoryPatchSchema } from "@/lib/validation";
import { getProduct } from "@/lib/catalog";
import { upsertInventory } from "@/lib/inventory";

/**
 * Updates stock for a product. Products added straight to Firestore have no stock row
 * yet ("not tracked"), so the row is created on first save.
 */
export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/inventory/[productId]">) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;
    const { productId } = await ctx.params;
    const data = inventoryPatchSchema.parse(await req.json());
    const product = await getProduct(productId);
    if (!product) return jsonError(404, "Product not found in the catalog.");
    const item = await upsertInventory(productId, product.sku, data);
    return NextResponse.json({ item });
  } catch (err) {
    return handleRouteError(err);
  }
}
