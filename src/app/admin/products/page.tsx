import Link from "next/link";
import { listProducts } from "@/lib/catalog";
import { getInventoryMap } from "@/lib/inventory";
import { ProductTable, type ProductRow } from "@/components/admin/product-table";

export default async function AdminProductsPage() {
  const products = await listProducts({ includeInactive: true });
  const inventory = await getInventoryMap(products.map((p) => p.id));
  const rows: ProductRow[] = products.map((p) => ({
    id: p.id, sku: p.sku, name: p.name, brand: p.brand, category: p.category, packSize: p.packSize,
    casePriceCents: p.casePriceCents, active: p.active,
    quantityOnHand: inventory.get(p.id)?.quantityOnHand ?? null,
    reorderPoint: inventory.get(p.id)?.reorderPoint ?? null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Products</h2>
        <Link href="/admin/products/new" className="btn-primary">+ Add product</Link>
      </div>
      <ProductTable rows={rows} />
    </div>
  );
}
