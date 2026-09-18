import type { Metadata } from "next";
import { categories, categoryName } from "@/config/categories";
import { searchProducts } from "@/lib/catalog";
import { getInventoryMap } from "@/lib/inventory";
import { canOrder, canSeePrices, getSession } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = { title: "Catalog" };

export default async function CatalogPage(props: PageProps<"/catalog">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const category = typeof sp.category === "string" ? sp.category : "";

  const session = await getSession();
  const products = await searchProducts({ q, category });
  const inventory = await getInventoryMap(products.map((p) => p.id));
  const showPrice = canSeePrices(session);
  const ordering = canOrder(session);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{category ? categoryName(category) : "Catalog"}</h1>
          <p className="text-sm text-neutral-600">{products.length} products · sold by the case</p>
        </div>
        <form className="flex flex-wrap gap-2" action="/catalog" method="get">
          <select name="category" defaultValue={category} className="input w-44">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="q" defaultValue={q} placeholder="Search products…" className="input w-56" />
          <button type="submit" className="btn-secondary">Filter</button>
        </form>
      </div>

      {!showPrice && (
        <p className="alert-info">
          Wholesale pricing is shown to approved account holders. Sign in or apply for an account to see case prices and order.
        </p>
      )}
      {session && !ordering && session.customer?.status === "PENDING" && (
        <p className="alert-info">Your account is pending approval. You will be able to order as soon as our team approves it.</p>
      )}

      {products.length === 0 ? (
        <div className="card text-center text-neutral-600">No products found. Try a different search or category.</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} inventory={inventory.get(p.id)} showPrice={showPrice} canOrder={ordering} />
          ))}
        </div>
      )}
    </div>
  );
}
