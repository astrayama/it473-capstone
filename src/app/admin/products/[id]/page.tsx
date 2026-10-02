import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import { listCategories } from "@/lib/categories";
import { tryGetInventoryMap } from "@/lib/inventory";
import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ArrowLeft } from "@/components/icons";

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params;
  const product = await getProduct(decodeURIComponent(id));
  if (!product) notFound();
  const [categories, inventory] = await Promise.all([listCategories(), tryGetInventoryMap([product.id], 5000)]);
  const stock = inventory?.get(product.id);

  return (
    <>
      <Link href="/admin/products" className="meta mb-6 inline-flex items-center gap-2 hover:text-fg">
        <ArrowLeft width={14} height={14} /> All products
      </Link>
      <AdminPageHeader
        eyebrow={product.sku}
        title={product.name}
        actions={product.active ? <span className="badge badge-dot badge-success">Visible</span> : <span className="badge badge-dot badge-neutral">Archived</span>}
      />
      {!inventory && <p className="alert-warning mb-6">Stock levels are unavailable right now; saving will update the catalog only.</p>}
      <ProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          id: product.id, sku: product.sku, name: product.name, description: product.description, category: product.category,
          unitOfMeasure: product.unitOfMeasure, priceCents: product.priceCents, imageUrl: product.imageUrl, active: product.active,
          origin: product.origin, packSize: product.packSize, storage: product.storage, shelfLife: product.shelfLife,
          notes: product.notes, season: product.season, certifications: product.certifications.join(", "),
          quantityOnHand: stock?.quantityOnHand ?? 0, reorderPoint: stock?.reorderPoint ?? 0, binLocation: stock?.binLocation ?? "",
        }}
      />
    </>
  );
}
