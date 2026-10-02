import "server-only";
import { cache } from "react";
import { FieldPath, FieldValue, Timestamp } from "firebase-admin/firestore";
import { firestore } from "@/lib/firebase/admin";
import { productImageUrl } from "@/lib/media";
import { skuFromId } from "@/lib/sku";
import { UserFacingError } from "@/lib/errors";

/**
 * Product catalog, stored in Firestore collection `catalog`. The document shape is the
 * team's shared contract, so this module maps it to the app's `Product` and back:
 *
 *   catalog/{sku-1001} {
 *     name, description, category,        // category = categories/{id}
 *     basePrice,                          // USD, e.g. 34.99 (double) or 45 (integer)
 *     unitOfMeasure,                      // "case" | "pack" | "bag" …
 *     imagePaths: ["products/sku-1001/images/primary.jpg"],   // media bucket objects
 *     isActive, createdAt, updatedAt,     // Firestore Timestamps
 *     // optional details (all may be absent):
 *     origin, packSize, storage, shelfLife, notes, season,   // strings
 *     certifications                      // string[], e.g. ["USDA Organic"]
 *   }
 *
 * Stock levels are NOT here; they live in Cloud SQL (see inventory.ts).
 */
/** Optional buyer-facing details. Empty string / empty list when a document doesn't set them. */
export interface ProductDetails {
  /** Where it's grown or made, e.g. "Central Valley, California". */
  origin: string;
  /** What's in one unit, e.g. "25 lb case", "12 × 1 qt". */
  packSize: string;
  /** e.g. "Refrigerated (34–38°F)". */
  storage: string;
  shelfLife: string;
  /** Chef's notes: one or two sensory lines. */
  notes: string;
  season: string;
  certifications: string[];
}

export const DETAIL_KEYS = ["origin", "packSize", "storage", "shelfLife", "notes", "season"] as const;

export interface Product extends ProductDetails {
  /** Firestore document id, e.g. "sku-1001". */
  id: string;
  /** Display SKU, e.g. "SKU-1001". */
  sku: string;
  name: string;
  description: string;
  category: string;
  unitOfMeasure: string;
  /** Price per unit of measure in cents. 0 means the price is missing and it can't be ordered. */
  priceCents: number;
  /** Object path of the primary photo in the media bucket. */
  imagePath: string | null;
  /** Same-origin URL for the primary photo (served by /media). */
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput extends Partial<ProductDetails> {
  name: string;
  description: string;
  category: string;
  unitOfMeasure: string;
  priceCents: number;
  active: boolean;
}

const COLLECTION = "catalog";
const DOC_ID = /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,127}$/;

function col() {
  return firestore().collection(COLLECTION);
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return "";
}

function toProduct(id: string, data: FirebaseFirestore.DocumentData): Product {
  const cents = Math.round(Number(data.basePrice) * 100);
  const paths: unknown[] = Array.isArray(data.imagePaths) ? data.imagePaths : [];
  const imagePath = typeof paths[0] === "string" ? paths[0] : null;
  const updatedAt = toIso(data.updatedAt);
  return {
    id,
    sku: skuFromId(id),
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    category: String(data.category ?? ""),
    unitOfMeasure: String(data.unitOfMeasure || "case"),
    priceCents: Number.isFinite(cents) && cents > 0 ? cents : 0,
    imagePath,
    imageUrl: productImageUrl(imagePath, updatedAt),
    active: data.isActive !== false,
    createdAt: toIso(data.createdAt),
    updatedAt,
    origin: text(data.origin),
    packSize: text(data.packSize),
    storage: text(data.storage),
    shelfLife: text(data.shelfLife),
    notes: text(data.notes),
    season: text(data.season),
    certifications: Array.isArray(data.certifications)
      ? data.certifications.filter((c: unknown): c is string => typeof c === "string" && c.trim() !== "")
      : [],
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** App fields -> the team's Firestore field names. Only the keys present are written. */
function toFirestore(input: Partial<ProductInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.name !== undefined) out.name = input.name;
  if (input.description !== undefined) out.description = input.description;
  if (input.category !== undefined) out.category = input.category;
  if (input.unitOfMeasure !== undefined) out.unitOfMeasure = input.unitOfMeasure;
  if (input.priceCents !== undefined) out.basePrice = input.priceCents / 100;
  if (input.active !== undefined) out.isActive = input.active;
  for (const key of DETAIL_KEYS) {
    if (input[key] !== undefined) out[key] = input[key];
  }
  if (input.certifications !== undefined) out.certifications = input.certifications;
  return out;
}

function grpcCode(err: unknown): number | undefined {
  return (err as { code?: number } | null)?.code;
}

/** Every product, sorted by name. The catalog is small, so it is read whole once per request. */
const allProducts = cache(async (): Promise<Product[]> => {
  const snap = await col().get();
  return snap.docs
    .map((d) => toProduct(d.id, d.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
});

export async function listProducts(opts: { includeInactive?: boolean } = {}): Promise<Product[]> {
  const all = await allProducts();
  return opts.includeInactive ? all : all.filter((p) => p.active);
}

export async function searchProducts(opts: {
  q?: string;
  category?: string;
  includeInactive?: boolean;
}): Promise<Product[]> {
  // The catalog is modest, so filtering in memory is fine. For a very large
  // catalog, move this to a search index (e.g. Firestore + Algolia/Typesense).
  let items = await listProducts({ includeInactive: opts.includeInactive });
  if (opts.category) items = items.filter((p) => p.category === opts.category);
  if (opts.q) {
    const q = opts.q.trim().toLowerCase();
    items = items.filter((p) =>
      [p.name, p.sku, p.description, p.origin, p.notes].some((f) => f.toLowerCase().includes(q)),
    );
  }
  return items;
}

export const getProduct = cache(async (id: string): Promise<Product | null> => {
  if (!DOC_ID.test(id)) return null;
  const doc = await col().doc(id).get();
  return doc.exists ? toProduct(doc.id, doc.data()!) : null;
});

export async function getProductsByIds(ids: string[]): Promise<Map<string, Product>> {
  const result = new Map<string, Product>();
  const unique = [...new Set(ids)].filter((id) => DOC_ID.test(id));
  // Firestore `in` queries take at most 30 values per call.
  for (let i = 0; i < unique.length; i += 30) {
    const chunk = unique.slice(i, i + 30);
    const snap = await col().where(FieldPath.documentId(), "in", chunk).get();
    snap.docs.forEach((d) => result.set(d.id, toProduct(d.id, d.data())));
  }
  return result;
}

export async function countProducts(): Promise<number> {
  const snap = await col().count().get();
  return snap.data().count;
}

/** Creates `catalog/{id}`. Fails atomically (409) if that SKU is already taken. */
export async function createProduct(id: string, input: ProductInput): Promise<Product> {
  const ref = col().doc(id);
  try {
    await ref.create({
      ...toFirestore(input),
      imagePaths: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    if (grpcCode(err) === 6) throw new UserFacingError(`SKU ${skuFromId(id)} is already in the catalog.`, 409);
    throw err;
  }
  const doc = await ref.get();
  return toProduct(doc.id, doc.data()!);
}

/** Updates only the contract fields given; any other fields on the document are kept. */
export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<Product> {
  const ref = col().doc(id);
  try {
    await ref.update({ ...toFirestore(patch), updatedAt: FieldValue.serverTimestamp() });
  } catch (err) {
    if (grpcCode(err) === 5) throw new UserFacingError("Product not found.", 404);
    throw err;
  }
  const doc = await ref.get();
  return toProduct(doc.id, doc.data()!);
}

/** Hides a product from the storefront. Documents are never deleted from the shared catalog. */
export function archiveProduct(id: string): Promise<Product> {
  return updateProduct(id, { active: false });
}

export function restoreProduct(id: string): Promise<Product> {
  return updateProduct(id, { active: true });
}

/** Sets (or clears, with null) the primary photo. Any additional imagePaths are kept. */
export async function setProductImage(id: string, path: string | null): Promise<Product> {
  const ref = col().doc(id);
  await firestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new UserFacingError("Product not found.", 404);
    const current: unknown[] = Array.isArray(snap.get("imagePaths")) ? snap.get("imagePaths") : [];
    const rest = current.slice(1).filter((p): p is string => typeof p === "string" && p !== path);
    tx.update(ref, { imagePaths: path ? [path, ...rest] : rest, updatedAt: FieldValue.serverTimestamp() });
  });
  const doc = await ref.get();
  return toProduct(doc.id, doc.data()!);
}
