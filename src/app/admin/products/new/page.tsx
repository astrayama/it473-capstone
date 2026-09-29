import Link from "next/link";
import { listCategories } from "@/lib/categories";
import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ArrowLeft } from "@/components/icons";

export default async function NewProductPage() {
  const categories = await listCategories();
  return (
    <>
      <Link href="/admin/products" className="meta mb-6 inline-flex items-center gap-2 hover:text-fg">
        <ArrowLeft width={14} height={14} /> All products
      </Link>
      <AdminPageHeader eyebrow="Catalog" title="Add a product" description="Saved to the shared Firestore catalog as catalog/sku-…" />
      <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </>
  );
}
