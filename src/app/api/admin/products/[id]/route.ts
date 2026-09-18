import { NextResponse } from "next/server";
import { handleRouteError, jsonError, requireAdminApi } from "@/lib/api";
import { productSchema } from "@/lib/validation";
import { deleteProduct, getProduct, updateProduct } from "@/lib/catalog";
import { deleteInventory, upsertInventory } from "@/lib/inventory";
import { db } from "@/lib/db";

export async function PUT(req: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;
    const { id } = await ctx.params;
    if (!(await getProduct(id))) return jsonError(404, "Product not found.");

    const { quantityOnHand, reorderPoint, binLocation, ...catalog } = productSchema.parse(await req.json());
    const skuTaken = await db().inventoryItem.findUnique({ where: { sku: catalog.sku } });
    if (skuTaken && skuTaken.productId !== id) return jsonError(409, `SKU ${catalog.sku} is already used by another product.`);

    const product = await updateProduct(id, catalog);
    await upsertInventory(id, product.sku, { quantityOnHand, reorderPoint, binLocation });
    return NextResponse.json({ product });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;
    const { id } = await ctx.params;
    await deleteProduct(id);
    await deleteInventory(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
