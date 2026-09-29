/**
 * Product photos live in a private Cloud Storage bucket and are served same-origin by
 * the /media route handler. These helpers are safe to use on the client.
 */
export const PRODUCT_FALLBACK = "/brand/product-fallback.svg";

const MEDIA_PATH = /^products\/[a-z0-9][a-z0-9-]*\/images\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:jpe?g|png|webp|avif)$/;

export function isAllowedMediaPath(path: string): boolean {
  return !path.includes("..") && MEDIA_PATH.test(path);
}

/** Bucket object path -> "/media/products/…", versioned by the product's updatedAt. */
export function productImageUrl(path: string | null | undefined, version?: string): string | null {
  if (!path || !isAllowedMediaPath(path)) return null;
  const url = `/media/${path.split("/").map(encodeURIComponent).join("/")}`;
  const v = version ? Date.parse(version) : NaN;
  return Number.isFinite(v) ? `${url}?v=${v}` : url;
}
