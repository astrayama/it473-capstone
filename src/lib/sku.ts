/**
 * SKUs double as Firestore document ids in the `catalog` collection: the team's
 * convention is `sku-1001`. People type them loosely ("1001", "SKU-1001", "sku 1001").
 */
const DOC_ID = /^sku-[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;

/** "4001" | "SKU-4001" | "sku 4001" -> "sku-4001". Returns null when nothing usable is left. */
export function normalizeSkuToId(input: string): string | null {
  const rest = input
    .trim()
    .toLowerCase()
    .replace(/^sku[\s_-]*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!rest) return null;
  const id = `sku-${rest}`;
  return DOC_ID.test(id) ? id : null;
}

/** Display form of a document id: "sku-1001" -> "SKU-1001". */
export function skuFromId(id: string): string {
  return id.toUpperCase();
}
