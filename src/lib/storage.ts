import "server-only";
import { Storage, type File as GcsFile } from "@google-cloud/storage";
import { MEDIA_BUCKET } from "@/config/gcp";
import { isAllowedMediaPath } from "@/lib/media";
import { UserFacingError } from "@/lib/errors";

/**
 * Product photos live in a PRIVATE Cloud Storage bucket (public access prevention is on),
 * at `products/{productId}/images/primary.{ext}`. Browsers never hit the bucket directly:
 * the /media route handler streams objects through the app.
 */
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

let storageClient: Storage | undefined;

function bucket() {
  storageClient ??= new Storage();
  return storageClient.bucket(MEDIA_BUCKET);
}

function httpCode(err: unknown): number | undefined {
  return (err as { code?: number } | null)?.code;
}

/** Uploads the primary photo for a product and returns its object path. */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new UserFacingError("Photo must be a JPEG, PNG, or WebP image.");
  if (file.size > MAX_BYTES) throw new UserFacingError("Photo must be smaller than 5 MB.");

  const objectName = `products/${productId}/images/primary.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    await bucket().file(objectName).save(buffer, {
      contentType: file.type,
      resumable: false,
      metadata: { cacheControl: "private, max-age=0" },
    });
  } catch (err) {
    if (httpCode(err) === 403) {
      throw new UserFacingError(
        `This server can't write to gs://${MEDIA_BUCKET}. A project owner needs to grant its service account roles/storage.objectCreator on that bucket.`,
        503,
      );
    }
    throw err;
  }
  return objectName;
}

export interface MediaObject {
  file: GcsFile;
  contentType: string;
  size: number | undefined;
  etag: string | undefined;
}

/**
 * Looks up a product photo for streaming. Returns null when the path isn't allowed, the
 * object doesn't exist, or this server isn't permitted to read the bucket.
 */
export async function openMediaObject(path: string): Promise<MediaObject | null> {
  if (!isAllowedMediaPath(path)) return null;
  const file = bucket().file(path);
  try {
    const [meta] = await file.getMetadata();
    const size = meta.size === undefined ? undefined : Number(meta.size);
    return {
      file,
      contentType: meta.contentType || "application/octet-stream",
      size: Number.isFinite(size) ? size : undefined,
      etag: meta.etag ? `"${meta.etag.replace(/"/g, "")}"` : undefined,
    };
  } catch (err) {
    const code = httpCode(err);
    if (code === 404 || code === 403 || code === 401) {
      if (code !== 404) console.warn(`Media read denied for gs://${MEDIA_BUCKET}/${path} (${code}).`);
      return null;
    }
    throw err;
  }
}
