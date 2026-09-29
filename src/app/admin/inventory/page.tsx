import { listInventory } from "@/lib/inventory";
import { listProducts } from "@/lib/catalog";
import { InventoryRow } from "@/components/admin/inventory-row";

export default async function AdminInventoryPage() {
  const [items, products] = await Promise.all([listInventory(), listProducts({ includeInactive: true })]);
  const byProduct = new Map(items.map((i) => [i.productId, i]));
  const known = new Set(products.map((p) => p.id));
  const low = items.filter((i) => known.has(i.productId) && i.quantityOnHand <= i.reorderPoint).length;
  const untracked = products.filter((p) => !byProduct.has(p.id)).length;
  // Stock rows whose product is gone from the Firestore catalog.
  const orphans = items.filter((i) => !known.has(i.productId));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Inventory</h2>
        <p className="text-sm text-neutral-600">
          Units on hand per product. {low > 0 ? `${low} item(s) at or below their low-stock alert.` : "All tracked items are above their low-stock alert."}
          {untracked > 0 && ` ${untracked} catalog item(s) aren't tracked yet; save a count to start tracking.`}
        </p>
      </div>
      <div className="card p-0">
        <table className="table">
          <thead>
            <tr><th>SKU</th><th>Product</th><th>On hand</th><th>Alert at</th><th>Bin</th><th /><th /></tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const i = byProduct.get(p.id);
              return (
                <InventoryRow
                  key={p.id}
                  productId={p.id}
                  sku={p.sku}
                  name={p.active ? p.name : `${p.name} (archived)`}
                  tracked={Boolean(i)}
                  quantityOnHand={i?.quantityOnHand ?? 0}
                  reorderPoint={i?.reorderPoint ?? 0}
                  binLocation={i?.binLocation ?? null}
                />
              );
            })}
            {orphans.map((i) => (
              <InventoryRow
                key={i.productId}
                productId={i.productId}
                sku={i.sku}
                name="(no longer in the catalog)"
                tracked
                readOnly
                quantityOnHand={i.quantityOnHand}
                reorderPoint={i.reorderPoint}
                binLocation={i.binLocation}
              />
            ))}
            {products.length === 0 && orphans.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-neutral-500">The catalog is empty. Add a product first.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
