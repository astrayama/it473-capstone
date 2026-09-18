import { notFound } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import { getInventoryMap } from "@/lib/inventory";
import { isStorageConfigured } from "@/lib/storage";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params;
  const product = await getProduct(id);
  if (!product) notFound();
  const stock = (await getInventoryMap([id])).get(id);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Edit: {product.name}</h2>
      <ProductForm
        storageConfigured={isStorageConfigured()}
        initial={{
          id: product.id, sku: product.sku, name: product.name, description: product.description, category: product.category,
          brand: product.brand, packSize: product.packSize, unitsPerCase: product.unitsPerCase, casePriceCents: product.casePriceCents,
          storage: product.storage, imageUrl: product.imageUrl, active: product.active,
          quantityOnHand: stock?.quantityOnHand ?? 0, reorderPoint: stock?.reorderPoint ?? 0, binLocation: stock?.binLocation ?? "",
        }}
      />
    </div>
  );
}
