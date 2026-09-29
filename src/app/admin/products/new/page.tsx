import { listCategories } from "@/lib/categories";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await listCategories();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Add a product</h2>
      <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
