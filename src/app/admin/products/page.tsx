import Link from "next/link";
import { listProducts } from "@/lib/catalog";
import { categoryLabel, listCategories } from "@/lib/categories";
import { tryGetInventoryMap } from "@/lib/inventory";
import { ProductTable, type ProductRow } from "@/components/admin/product-table";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([listProducts({ includeInactive: true }), listCategories()]);
  const inventory = await tryGetInventoryMap(products.map((p) => p.id), 5000);
  const rows: ProductRow[] = products.map((p) => ({
    id: p.id, sku: p.sku, name: p.name, categoryLabel: categoryLabel(categories, p.category),
    unitOfMeasure: p.unitOfMeasure, priceCents: p.priceCents, active: p.active,
    quantityOnHand: inventory?.get(p.id)?.quantityOnHand ?? null,
    reorderPoint: inventory?.get(p.id)?.reorderPoint ?? null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Products</h2>
        <Link href="/admin/products/new" className="btn-primary">+ Add product</Link>
      </div>
      {!inventory && <p className="alert-info">Stock levels are unavailable right now (the stock database can&apos;t be reached).</p>}
      <ProductTable rows={rows} />
    </div>
  );
}
