import Link from "next/link";
import { ViewTransition } from "react";
import type { Product } from "@/lib/catalog";
import { stockLevel, type InventoryItem } from "@/lib/inventory";
import { transitionName } from "@/lib/motion";
import { ProductImage } from "@/components/product-image";
import { StockBadge } from "@/components/stock-badge";
import { Price } from "@/components/price";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

interface Props {
  product: Product;
  categoryLabel: string;
  /** Stock map for the page, or null when the stock database is unavailable. */
  inventory: Map<string, InventoryItem> | null;
  showPrice: boolean;
  canOrder: boolean;
}

export function ProductCard({ product, categoryLabel, inventory, showPrice, canOrder }: Props) {
  const item = inventory?.get(product.id);
  const level = inventory ? stockLevel(item) : null;
  const href = `/catalog/${encodeURIComponent(product.id)}`;
  return (
    <article className="product-card group relative flex flex-col">
      <Link href={href} className="block rounded-lg" aria-label={product.name}>
        <ViewTransition name={transitionName("product", product.id)} share="morph" default="none">
          <ProductImage
            src={product.imageUrl}
            alt=""
            aspect="4/5"
            className="card-media rounded-lg"
            imgClassName="card-img"
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          />
        </ViewTransition>
      </Link>
      <div className="flex flex-1 flex-col pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">{categoryLabel}</p>
          <StockBadge level={level} />
        </div>
        <h3 className="mt-3 font-display text-[1.75rem] leading-tight">
          <Link href={href} className="transition-colors hover:text-accent-ink">{product.name}</Link>
        </h3>
        {product.description && <p className="mt-2 line-clamp-2 text-sm text-fg-2">{product.description}</p>}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5">
          {showPrice ? (
            <Price cents={product.priceCents} unit={product.unitOfMeasure} />
          ) : (
            <Link href={`/login?next=${encodeURIComponent(href)}`} className="link text-sm text-fg-2">
              Sign in for trade pricing
            </Link>
          )}
          <span className="numeric text-xs tracking-[0.08em] text-fg-3">{product.sku}</span>
        </div>
        {canOrder && (
          <div className="mt-5">
            <AddToCartButton
              item={{
                productId: product.id,
                sku: product.sku,
                name: product.name,
                unitOfMeasure: product.unitOfMeasure,
                category: product.category,
                priceCents: product.priceCents,
                imageUrl: product.imageUrl,
              }}
              maxQuantity={inventory ? (item?.quantityOnHand ?? 0) : null}
            />
          </div>
        )}
      </div>
    </article>
  );
}
