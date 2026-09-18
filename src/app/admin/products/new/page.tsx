import { isStorageConfigured } from "@/lib/storage";
import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Add a product</h2>
      <ProductForm storageConfigured={isStorageConfigured()} />
    </div>
  );
}
