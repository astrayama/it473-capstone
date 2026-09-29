import { NextResponse } from "next/server";
import { handleRouteError, jsonError, requireAdminApi } from "@/lib/api";
import { getProduct, setProductImage } from "@/lib/catalog";
import { uploadProductImage } from "@/lib/storage";

/** Multipart upload of a product's primary photo to the media bucket. Returns { product }. */
export async function POST(req: Request, ctx: RouteContext<"/api/admin/products/[id]/image">) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;
    const { id } = await ctx.params;
    if (!(await getProduct(id))) return jsonError(404, "Product not found.");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError(400, "No file was uploaded.");

    const path = await uploadProductImage(file, id);
    const product = await setProductImage(id, path);
    return NextResponse.json({ product });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** Removes the primary photo from the product (the object itself stays in the bucket). */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/products/[id]/image">) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;
    const { id } = await ctx.params;
    const product = await setProductImage(id, null);
    return NextResponse.json({ product });
  } catch (err) {
    return handleRouteError(err);
  }
}
