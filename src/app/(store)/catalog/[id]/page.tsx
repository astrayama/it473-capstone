import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import { categoryLabel, listCategories } from "@/lib/categories";
import { stockLevel, tryGetInventoryMap } from "@/lib/inventory";
import { canOrder, canSeePrices, getSession } from "@/lib/auth";
import { formatCents, perUnit } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { StockBadge } from "@/components/stock-badge";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

export async function generateMetadata(props: PageProps<"/catalog/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const product = await getProduct(decodeURIComponent(id));
  if (!product || !product.active) return { title: "Not found" };
  return { title: product.name, description: product.description };
}

export default async function ProductPage(props: PageProps<"/catalog/[id]">) {
  const { id } = await props.params;
  const product = await getProduct(decodeURIComponent(id));
  if (!product || !product.active) notFound();

  const [session, inventory, categories] = await Promise.all([
    getSession(),
    tryGetInventoryMap([product.id]),
    listCategories(),
  ]);
  const stock = inventory?.get(product.id);
  const showPrice = canSeePrices(session);
  const ordering = canOrder(session);
  const href = `/catalog/${encodeURIComponent(product.id)}`;
  const category = categoryLabel(categories, product.category);

  return (
    <div className="container-page space-y-6 py-8">
      <nav className="text-sm text-neutral-500">
        <Link href="/catalog" className="hover:underline">Catalog</Link> ›{" "}
        <Link href={`/catalog?category=${encodeURIComponent(product.category)}`} className="hover:underline">{category}</Link>
      </nav>
      <div className="grid gap-8 md:grid-cols-2">
        <ProductImage src={product.imageUrl} alt={product.name} aspect="4/5" eager sizes="(min-width: 768px) 50vw, 100vw" />
        <div className="space-y-4">
          <div className="text-sm uppercase tracking-wide text-neutral-500">{category}</div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-neutral-700">{product.description}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-neutral-500">SKU</dt><dd className="font-mono">{product.sku}</dd>
            <dt className="text-neutral-500">Sold by the</dt><dd className="capitalize">{product.unitOfMeasure}</dd>
            <dt className="text-neutral-500">Category</dt><dd>{category}</dd>
            {inventory && (
              <>
                <dt className="text-neutral-500">Availability</dt><dd><StockBadge level={stockLevel(stock)} /></dd>
              </>
            )}
          </dl>
          {showPrice ? (
            product.priceCents > 0 ? (
              <div className="text-3xl font-semibold">
                {formatCents(product.priceCents)} <span className="text-base font-normal text-neutral-500">{perUnit(product.unitOfMeasure)}</span>
              </div>
            ) : (
              <p className="text-neutral-600">Price on request.</p>
            )
          ) : (
            <p className="alert-info">
              <Link href={`/login?next=${encodeURIComponent(href)}`} className="font-medium underline">Sign in</Link> to see wholesale pricing.
            </p>
          )}
          {ordering && (
            <AddToCartButton
              showQuantity
              item={{
                productId: product.id, sku: product.sku, name: product.name, unitOfMeasure: product.unitOfMeasure,
                category: product.category, priceCents: product.priceCents, imageUrl: product.imageUrl,
              }}
              maxQuantity={inventory ? (stock?.quantityOnHand ?? 0) : null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
