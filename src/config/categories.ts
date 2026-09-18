/**
 * Product categories. Products in Firestore reference a category by `id`.
 * To add a category, add a row here (and a placeholder image in public/placeholders/).
 */
export type StorageType = "refrigerated" | "frozen" | "ambient";

export type CategoryId =
  | "dairy"
  | "frozen"
  | "beverages"
  | "produce"
  | "dry-goods"
  | "meat-seafood";

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  defaultStorage: StorageType;
}

export const categories: Category[] = [
  { id: "dairy", name: "Dairy", description: "Milk, cheese, butter, yogurt, and eggs.", defaultStorage: "refrigerated" },
  { id: "frozen", name: "Frozen Foods", description: "Frozen vegetables, fries, desserts, and prepared foods.", defaultStorage: "frozen" },
  { id: "beverages", name: "Beverages", description: "Water, soda, juice, coffee, and tea.", defaultStorage: "ambient" },
  { id: "produce", name: "Produce", description: "Fresh fruits and vegetables.", defaultStorage: "refrigerated" },
  { id: "dry-goods", name: "Dry Goods", description: "Rice, flour, pasta, canned goods, and pantry staples.", defaultStorage: "ambient" },
  { id: "meat-seafood", name: "Meat & Seafood", description: "Poultry, beef, pork, and seafood.", defaultStorage: "frozen" },
];

export const categoryIds = categories.map((c) => c.id) as [CategoryId, ...CategoryId[]];
export const storageTypes = ["refrigerated", "frozen", "ambient"] as const;

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function categoryName(id: string): string {
  return getCategory(id)?.name ?? id;
}
