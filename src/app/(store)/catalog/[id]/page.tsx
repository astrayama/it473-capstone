import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { getProduct } from "@/lib/catalog";
import { categoryLabel, listCategories } from "@/lib/categories";
import { stockLevel, tryGetInventoryMap } from "@/lib/inventory";
import { canOrder, canSeePrices, getSession } from "@/lib/auth";
import { transitionName } from "@/lib/motion";
import { ProductImage } from "@/components/product-image";
import { StockBadge } from "@/components/stock-badge";
import { Price } from "@/components/price";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ArrowLeft } from "@/components/icons";

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
    <div className="container-page py-10 md:py-16">
      <nav aria-label="Breadcrumb" className="meta flex flex-wrap items-center gap-2">
        <Link href="/catalog" className="inline-flex items-center gap-2 transition-colors hover:text-fg">
          <ArrowLeft width={14} height={14} /> Catalog
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/catalog?category=${encodeURIComponent(product.category)}`} className="transition-colors hover:text-fg">{category}</Link>
      </nav>

      <div className="mt-8 grid gap-12 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-20">
        <ViewTransition name={transitionName("product", product.id)} share="morph" default="none">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            aspect="4/5"
            eager
            sizes="(min-width: 768px) 50vw, 100vw"
            className="rounded-lg md:sticky md:top-[calc(var(--header-h)+2rem)]"
          />
        </ViewTransition>

        <div className="rise-group md:py-6">
          <p className="eyebrow">{category}</p>
          <h1 className="display-m mt-5">{product.name}</h1>
          {product.description && <p className="lede mt-6">{product.description}</p>}

          <div className="mt-10">
            {showPrice ? (
              <Price cents={product.priceCents} unit={product.unitOfMeasure} size="lg" />
            ) : (
              <p className="alert-info">
                <Link href={`/login?next=${encodeURIComponent(href)}`} className="link font-medium">Sign in</Link> to see trade
                pricing, or <Link href="/register" className="link font-medium">apply for an account</Link>.
              </p>
            )}
          </div>

          {ordering && (
            <div className="mt-8">
              <AddToCartButton
                showQuantity
                item={{
                  productId: product.id, sku: product.sku, name: product.name, unitOfMeasure: product.unitOfMeasure,
                  category: product.category, priceCents: product.priceCents, imageUrl: product.imageUrl,
                }}
                maxQuantity={inventory ? (stock?.quantityOnHand ?? 0) : null}
              />
            </div>
          )}

          <dl className="ledger mt-12">
            <dt>SKU</dt>
            <dd className="numeric tracking-[0.06em]">{product.sku}</dd>
            <dt>Sold by the</dt>
            <dd className="capitalize">{product.unitOfMeasure}</dd>
            <dt>Category</dt>
            <dd>{category}</dd>
            {inventory && (
              <>
                <dt>Availability</dt>
                <dd><StockBadge level={stockLevel(stock)} /></dd>
              </>
            )}
          </dl>
          <p className="meta mt-6">Delivery and applicable taxes are confirmed on your invoice.</p>
        </div>
      </div>
    </div>
  );
}
