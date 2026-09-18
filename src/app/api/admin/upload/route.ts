import { NextResponse } from "next/server";
import { handleRouteError, jsonError, requireAdminApi } from "@/lib/api";
import { isStorageConfigured, uploadProductImage } from "@/lib/storage";

/** Multipart upload of a product photo to Cloud Storage. Returns { url }. */
export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;
    if (!isStorageConfigured()) return jsonError(503, "Photo uploads are disabled: GCS_BUCKET is not set.");

    const form = await req.formData();
    const file = form.get("file");
    const name = String(form.get("name") ?? "product");
    if (!(file instanceof File)) return jsonError(400, "No file was uploaded.");

    const url = await uploadProductImage(file, name);
    return NextResponse.json({ url });
  } catch (err) {
    return handleRouteError(err);
  }
}
