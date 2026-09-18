import { NextResponse } from "next/server";
import { handleRouteError, jsonError, requireAdminApi } from "@/lib/api";
import { customerStatusSchema } from "@/lib/validation";
import { db } from "@/lib/db";

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/customers/[id]">) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;
    const { id } = await ctx.params;
    const { status } = customerStatusSchema.parse(await req.json());
    if (!(await db().customer.findUnique({ where: { id }, select: { id: true } }))) return jsonError(404, "Customer not found.");
    const customer = await db().customer.update({ where: { id }, data: { status } });
    return NextResponse.json({ customer });
  } catch (err) {
    return handleRouteError(err);
  }
}
