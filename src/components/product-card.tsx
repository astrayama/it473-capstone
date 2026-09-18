import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { stockLevel, type InventoryItem } from "@/lib/inventory";
import { formatCents } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { StockBadge } from "@/components/stock-badge";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

interface Props {
  product: Product;
  inventory?: InventoryItem;
  showPrice: boolean;
  canOrder: boolean;
}

export function ProductCard({ product, inventory, showPrice, canOrder }: Props) {
  const level = stockLevel(inventory);
  return (
    <div className="card flex flex-col gap-3">
      <Link href={`/catalog/${product.slug}`}>
        <ProductImage src={product.imageUrl} category={product.category} alt={product.name} size={280} className="w-full" />
      </Link>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-wide text-neutral-500">{product.brand}</div>
        <Link href={`/catalog/${product.slug}`} className="font-semibold hover:underline">
          {product.name}
        </Link>
        <div className="text-sm text-neutral-600">{product.packSize}</div>
      </div>
      <div className="flex items-center justify-between">
        {showPrice ? (
          <span className="text-lg font-semibold">
            {formatCents(product.casePriceCents)} <span className="text-xs font-normal text-neutral-500">/ case</span>
          </span>
        ) : (
          <Link href="/login" className="text-sm text-brand-700 underline">Sign in for pricing</Link>
        )}
        <StockBadge level={level} />
      </div>
      {canOrder && (
        <AddToCartButton
          item={{
            productId: product.id,
            slug: product.slug,
            sku: product.sku,
            name: product.name,
            packSize: product.packSize,
            category: product.category,
            casePriceCents: product.casePriceCents,
            imageUrl: product.imageUrl,
          }}
          maxQuantity={inventory?.quantityOnHand ?? 0}
        />
      )}
    </div>
  );
}
