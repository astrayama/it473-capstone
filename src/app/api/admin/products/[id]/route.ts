import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRouteError, jsonError, requireAdminApi } from "@/lib/api";
import { productUpdateSchema } from "@/lib/validation";
import { archiveProduct, getProduct, restoreProduct, updateProduct } from "@/lib/catalog";
import { listCategories } from "@/lib/categories";
import { upsertInventory } from "@/lib/inventory";

export async function PUT(req: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;
    const { id } = await ctx.params;
    if (!(await getProduct(id))) return jsonError(404, "Product not found.");

    const { quantityOnHand, reorderPoint, binLocation, ...catalog } = productUpdateSchema.parse(await req.json());
    const categories = await listCategories();
    if (!categories.some((c) => c.id === catalog.category)) return jsonError(400, "Choose one of the catalog's categories.");

    const product = await updateProduct(id, catalog);
    let stockSaved = true;
    try {
      await upsertInventory(id, product.sku, { quantityOnHand, reorderPoint, binLocation });
    } catch (err) {
      console.error("Stock not saved:", err);
      stockSaved = false;
    }
    return NextResponse.json({
      product,
      stockSaved,
      ...(stockSaved ? {} : { warning: "Product saved, but stock wasn't: the stock database is unavailable." }),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

const visibilitySchema = z.object({ active: z.boolean() });

/** Archive (hide) or restore a product. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;
    const { id } = await ctx.params;
    const { active } = visibilitySchema.parse(await req.json());
    const product = active ? await restoreProduct(id) : await archiveProduct(id);
    return NextResponse.json({ product });
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * "Delete" archives: the Firestore catalog is shared with the rest of the team, so
 * documents are hidden (isActive: false), never removed. Stock rows are kept too.
 */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;
    const { id } = await ctx.params;
    const product = await archiveProduct(id);
    return NextResponse.json({ product });
  } catch (err) {
    return handleRouteError(err);
  }
}
