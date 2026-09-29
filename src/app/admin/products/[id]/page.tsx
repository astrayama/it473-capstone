import { notFound } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import { listCategories } from "@/lib/categories";
import { tryGetInventoryMap } from "@/lib/inventory";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params;
  const product = await getProduct(decodeURIComponent(id));
  if (!product) notFound();
  const [categories, inventory] = await Promise.all([listCategories(), tryGetInventoryMap([product.id], 5000)]);
  const stock = inventory?.get(product.id);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Edit: {product.name}</h2>
      {!inventory && <p className="alert-info">Stock levels are unavailable right now; saving will update the catalog only.</p>}
      <ProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          id: product.id, sku: product.sku, name: product.name, description: product.description, category: product.category,
          unitOfMeasure: product.unitOfMeasure, priceCents: product.priceCents, imageUrl: product.imageUrl, active: product.active,
          quantityOnHand: stock?.quantityOnHand ?? 0, reorderPoint: stock?.reorderPoint ?? 0, binLocation: stock?.binLocation ?? "",
        }}
      />
    </div>
  );
}
