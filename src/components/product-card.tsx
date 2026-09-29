import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { stockLevel, type InventoryItem } from "@/lib/inventory";
import { formatCents, perUnit } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { StockBadge } from "@/components/stock-badge";
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
    <div className="card flex flex-col gap-3">
      <Link href={href}>
        <ProductImage src={product.imageUrl} alt={product.name} aspect="4/5" />
      </Link>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-wide text-neutral-500">{categoryLabel}</div>
        <Link href={href} className="font-semibold hover:underline">
          {product.name}
        </Link>
        <div className="text-sm text-neutral-600">{product.description}</div>
      </div>
      <div className="flex items-center justify-between">
        {showPrice && product.priceCents > 0 ? (
          <span className="text-lg font-semibold">
            {formatCents(product.priceCents)} <span className="text-xs font-normal text-neutral-500">{perUnit(product.unitOfMeasure)}</span>
          </span>
        ) : showPrice ? (
          <span className="text-sm text-neutral-500">Price on request</span>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(href)}`} className="text-sm text-brand-700 underline">Sign in for pricing</Link>
        )}
        <StockBadge level={level} />
      </div>
      {canOrder && (
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
      )}
    </div>
  );
}
