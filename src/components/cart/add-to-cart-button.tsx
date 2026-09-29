"use client";

import { useRef, useState } from "react";
import { useCart, type CartItem } from "@/components/cart/cart-store";
import { Check, Minus, Plus } from "@/components/icons";

interface Props {
  item: Omit<CartItem, "quantity">;
  /** Units on hand, or null when stock is unknown (the server re-checks at checkout). */
  maxQuantity: number | null;
  showQuantity?: boolean;
}

export function AddToCartButton({ item, maxQuantity, showQuantity = false }: Props) {
  const cart = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const max = maxQuantity ?? 999;
  const unavailable = item.priceCents <= 0;
  const disabled = max <= 0 || unavailable;
  const clamp = (n: number) => Math.max(1, Math.min(max, Math.round(n) || 1));

  function onAdd() {
    cart.add(item, qty);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {showQuantity && !disabled && (
        <div className="inline-flex items-center rounded-full border border-line-strong">
          <button type="button" className="btn-ghost rounded-full px-3 py-3" onClick={() => setQty((q) => clamp(q - 1))} aria-label="One fewer">
            <Minus width={16} height={16} />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            value={qty}
            onChange={(e) => setQty(clamp(Number(e.target.value)))}
            className="numeric w-12 bg-transparent text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            aria-label={`Quantity (${item.unitOfMeasure})`}
          />
          <button type="button" className="btn-ghost rounded-full px-3 py-3" onClick={() => setQty((q) => clamp(q + 1))} aria-label="One more">
            <Plus width={16} height={16} />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className={`${showQuantity ? "btn-primary btn-lg" : "btn-secondary btn-sm"} ${added ? "is-added" : ""}`}
        aria-live="polite"
      >
        {disabled ? (
          unavailable ? "Unavailable" : "Out of stock"
        ) : added ? (
          <>
            <Check width={16} height={16} className="draw-check" /> Added to your order
          </>
        ) : (
          `Add to order${showQuantity ? "" : ` · 1 ${item.unitOfMeasure}`}`
        )}
      </button>
    </div>
  );
}
