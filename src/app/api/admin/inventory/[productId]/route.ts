import { NextResponse } from "next/server";
import { handleRouteError, jsonError, requireAdminApi } from "@/lib/api";
import { inventoryPatchSchema } from "@/lib/validation";
import { db } from "@/lib/db";

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/inventory/[productId]">) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;
    const { productId } = await ctx.params;
    const data = inventoryPatchSchema.parse(await req.json());
    const existing = await db().inventoryItem.findUnique({ where: { productId } });
    if (!existing) return jsonError(404, "Inventory row not found.");
    const item = await db().inventoryItem.update({ where: { productId }, data });
    return NextResponse.json({ item });
  } catch (err) {
    return handleRouteError(err);
  }
}
