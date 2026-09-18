import "server-only";
import { FieldPath } from "firebase-admin/firestore";
import { firestore } from "@/lib/firebase/admin";
import type { CategoryId, StorageType } from "@/config/categories";

/**
 * Product catalog, stored in Firestore collection `products`.
 * Stock levels are NOT here; they live in Cloud SQL (see inventory.ts).
 */
export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  category: CategoryId;
  brand: string;
  packSize: string; // e.g. "12 × 32 oz"
  unitsPerCase: number;
  casePriceCents: number;
  storage: StorageType;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Omit<Product, "id" | "slug" | "createdAt" | "updatedAt">;

const COLLECTION = "products";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function toProduct(id: string, data: FirebaseFirestore.DocumentData): Product {
  return {
    id,
    sku: data.sku ?? "",
    name: data.name ?? "",
    slug: data.slug ?? id,
    description: data.description ?? "",
    category: data.category,
    brand: data.brand ?? "",
    packSize: data.packSize ?? "",
    unitsPerCase: Number(data.unitsPerCase ?? 1),
    casePriceCents: Number(data.casePriceCents ?? 0),
    storage: data.storage ?? "ambient",
    imageUrl: data.imageUrl ?? null,
    active: data.active !== false,
    createdAt: data.createdAt ?? "",
    updatedAt: data.updatedAt ?? "",
  };
}

function col() {
  return firestore().collection(COLLECTION);
}

export async function listProducts(opts: { includeInactive?: boolean } = {}): Promise<Product[]> {
  const snap = await col().orderBy("name").get();
  const all = snap.docs.map((d) => toProduct(d.id, d.data()));
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
      [p.name, p.brand, p.sku, p.description].some((f) => f.toLowerCase().includes(q)),
    );
  }
  return items;
}

export async function getProduct(id: string): Promise<Product | null> {
  const doc = await col().doc(id).get();
  return doc.exists ? toProduct(doc.id, doc.data()!) : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const snap = await col().where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return toProduct(d.id, d.data());
}

export async function getProductsByIds(ids: string[]): Promise<Map<string, Product>> {
  const result = new Map<string, Product>();
  const unique = [...new Set(ids)];
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

async function uniqueSlug(base: string, sku: string): Promise<string> {
  const slug = slugify(base) || slugify(sku) || "product";
  const existing = await getProductBySlug(slug);
  if (!existing) return slug;
  return `${slug}-${slugify(sku)}`;
}

export async function createProduct(input: ProductInput, id?: string): Promise<Product> {
  const now = new Date().toISOString();
  const slug = await uniqueSlug(input.name, input.sku);
  const docRef = id ? col().doc(id) : col().doc();
  const data = { ...input, slug, createdAt: now, updatedAt: now };
  await docRef.set(data);
  return toProduct(docRef.id, data);
}

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<Product> {
  const docRef = col().doc(id);
  await docRef.set({ ...patch, updatedAt: new Date().toISOString() }, { merge: true });
  const doc = await docRef.get();
  return toProduct(doc.id, doc.data()!);
}

export async function deleteProduct(id: string): Promise<void> {
  await col().doc(id).delete();
}
