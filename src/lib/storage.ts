import "server-only";
import { Storage } from "@google-cloud/storage";
import { slugify } from "@/lib/catalog";
import { UserFacingError } from "@/lib/errors";

/**
 * Product photos are uploaded to a Cloud Storage bucket with public read access
 * and served straight from storage.googleapis.com.
 */
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

let storageClient: Storage | undefined;

export function isStorageConfigured(): boolean {
  return Boolean(process.env.GCS_BUCKET);
}

function bucket() {
  const name = process.env.GCS_BUCKET;
  if (!name) throw new Error("GCS_BUCKET is not set. Photo uploads are disabled.");
  storageClient ??= new Storage();
  return storageClient.bucket(name);
}

export async function uploadProductImage(file: File, nameHint: string): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new UserFacingError("Photo must be a JPEG, PNG, or WebP image.");
  if (file.size > MAX_BYTES) throw new UserFacingError("Photo must be smaller than 5 MB.");

  const objectName = `products/${slugify(nameHint) || "product"}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const b = bucket();
  await b.file(objectName).save(buffer, {
    contentType: file.type,
    resumable: false,
    metadata: { cacheControl: "public, max-age=31536000" },
  });
  return `https://storage.googleapis.com/${b.name}/${objectName}`;
}
