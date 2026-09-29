import "server-only";
import { cache } from "react";
import { firestore } from "@/lib/firebase/admin";
import { titleCase } from "@/lib/format";

/**
 * Product categories, stored in Firestore collection `categories` (schema owned by the team):
 *   categories/{id} { id, name, description, sortOrder }   (sortOrder is stored as a string)
 */
export interface Category {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
}

export const listCategories = cache(async (): Promise<Category[]> => {
  const snap = await firestore().collection("categories").get();
  return snap.docs
    .map((d) => {
      const data = d.data();
      const order = Number(data.sortOrder);
      return {
        id: d.id,
        name: String(data.name || titleCase(d.id)),
        description: String(data.description ?? ""),
        sortOrder: Number.isFinite(order) ? order : Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
});

/** Label for a category id; unknown ids (e.g. a category removed later) are title-cased. */
export function categoryLabel(categories: Category[], id: string): string {
  return categories.find((c) => c.id === id)?.name ?? titleCase(id);
}
