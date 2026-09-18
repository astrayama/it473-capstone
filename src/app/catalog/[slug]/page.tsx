import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryName } from "@/config/categories";
import { getProductBySlug } from "@/lib/catalog";
import { getInventoryMap, stockLevel } from "@/lib/inventory";
import { canOrder, canSeePrices, getSession } from "@/lib/auth";
import { formatCents } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { StockBadge } from "@/components/stock-badge";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

export default async function ProductPage(props: PageProps<"/catalog/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active) notFound();

  const [session, inventory] = await Promise.all([getSession(), getInventoryMap([product.id])]);
  const stock = inventory.get(product.id);
  const showPrice = canSeePrices(session);
  const ordering = canOrder(session);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-neutral-500">
        <Link href="/catalog" className="hover:underline">Catalog</Link> ›{" "}
        <Link href={`/catalog?category=${product.category}`} className="hover:underline">{categoryName(product.category)}</Link>
      </nav>
      <div className="grid gap-8 md:grid-cols-2">
        <ProductImage src={product.imageUrl} category={product.category} alt={product.name} size={520} className="w-full" />
        <div className="space-y-4">
          <div className="text-sm uppercase tracking-wide text-neutral-500">{product.brand}</div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-neutral-700">{product.description}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-neutral-500">SKU</dt><dd className="font-mono">{product.sku}</dd>
            <dt className="text-neutral-500">Pack size</dt><dd>{product.packSize}</dd>
            <dt className="text-neutral-500">Units per case</dt><dd>{product.unitsPerCase}</dd>
            <dt className="text-neutral-500">Storage</dt><dd className="capitalize">{product.storage}</dd>
            <dt className="text-neutral-500">Availability</dt><dd><StockBadge level={stockLevel(stock)} /></dd>
          </dl>
          {showPrice ? (
            <div className="text-3xl font-semibold">
              {formatCents(product.casePriceCents)} <span className="text-base font-normal text-neutral-500">per case</span>
            </div>
          ) : (
            <p className="alert-info">
              <Link href={`/login?next=/catalog/${product.slug}`} className="font-medium underline">Sign in</Link> to see wholesale pricing.
            </p>
          )}
          {ordering && (
            <AddToCartButton
              showQuantity
              item={{
                productId: product.id, slug: product.slug, sku: product.sku, name: product.name, packSize: product.packSize,
                category: product.category, casePriceCents: product.casePriceCents, imageUrl: product.imageUrl,
              }}
              maxQuantity={stock?.quantityOnHand ?? 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}
