import Link from "next/link";
import { listProducts } from "@/lib/catalog";
import { categoryLabel, listCategories } from "@/lib/categories";
import { tryGetInventoryMap } from "@/lib/inventory";
import { ProductTable, type ProductRow } from "@/components/admin/product-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Plus } from "@/components/icons";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([listProducts({ includeInactive: true }), listCategories()]);
  const inventory = await tryGetInventoryMap(products.map((p) => p.id), 5000);
  const rows: ProductRow[] = products.map((p) => ({
    id: p.id, sku: p.sku, name: p.name, categoryLabel: categoryLabel(categories, p.category),
    unitOfMeasure: p.unitOfMeasure, priceCents: p.priceCents, active: p.active, imageUrl: p.imageUrl,
    quantityOnHand: inventory?.get(p.id)?.quantityOnHand ?? null,
    reorderPoint: inventory?.get(p.id)?.reorderPoint ?? null,
  }));

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Products"
        description="The shared Firestore catalog. Archived products are hidden from the storefront but kept for the team."
        actions={
          <Link href="/admin/products/new" className="btn-primary">
            <Plus width={16} height={16} /> Add product
          </Link>
        }
      />
      {!inventory && <p className="alert-warning mb-6">Stock levels are unavailable right now (the stock database can&apos;t be reached).</p>}
      <ProductTable rows={rows} />
    </>
  );
}
