import { NextResponse } from "next/server";
import { handleRouteError, jsonError, requireAdminApi } from "@/lib/api";
import { orderStatusSchema } from "@/lib/validation";
import { setOrderStatus } from "@/lib/orders";
import { db } from "@/lib/db";

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/orders/[id]">) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;
    const { id } = await ctx.params;
    const { status } = orderStatusSchema.parse(await req.json());
    if (!(await db().order.findUnique({ where: { id }, select: { id: true } }))) return jsonError(404, "Order not found.");
    await setOrderStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
