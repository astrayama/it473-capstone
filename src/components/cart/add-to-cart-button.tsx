"use client";

import { useState } from "react";
import { useCart, type CartItem } from "@/components/cart/cart-store";

interface Props {
  item: Omit<CartItem, "quantity">;
  maxQuantity: number;
  showQuantity?: boolean;
}

export function AddToCartButton({ item, maxQuantity, showQuantity = false }: Props) {
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const disabled = maxQuantity <= 0;

  function onAdd() {
    cart.add(item, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex items-center gap-2">
      {showQuantity && (
        <input
          type="number"
          min={1}
          max={maxQuantity}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(maxQuantity, Number(e.target.value) || 1)))}
          className="input w-20"
          aria-label="Cases"
        />
      )}
      <button type="button" onClick={onAdd} disabled={disabled} className="btn-primary">
        {disabled ? "Out of stock" : added ? "Added ✓" : "Add to cart"}
      </button>
    </div>
  );
}
