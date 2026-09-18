import { listInventory } from "@/lib/inventory";
import { getProductsByIds } from "@/lib/catalog";
import { InventoryRow } from "@/components/admin/inventory-row";

export default async function AdminInventoryPage() {
  const items = await listInventory();
  const products = await getProductsByIds(items.map((i) => i.productId));
  const low = items.filter((i) => i.quantityOnHand <= i.reorderPoint).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Inventory</h2>
        <p className="text-sm text-neutral-600">
          Cases on hand per product. {low > 0 ? `${low} item(s) at or below their low-stock alert.` : "All items above their low-stock alert."}
        </p>
      </div>
      <div className="card p-0">
        <table className="table">
          <thead>
            <tr><th>SKU</th><th>Product</th><th>On hand</th><th>Alert at</th><th>Bin</th><th /><th /></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <InventoryRow
                key={i.productId}
                productId={i.productId}
                sku={i.sku}
                name={products.get(i.productId)?.name ?? "(product removed from catalog)"}
                quantityOnHand={i.quantityOnHand}
                reorderPoint={i.reorderPoint}
                binLocation={i.binLocation}
              />
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-neutral-500">No inventory yet. Add a product first.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
