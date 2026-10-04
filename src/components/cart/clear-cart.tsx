"use client";

import { useEffect } from "react";
import { cartActions } from "@/components/cart/cart-store";

/**
 * Empties the browser cart once an order exists. Rendered on the confirmation page, so a
 * buyer who backs out of Stripe Checkout returns to a cart that still has their items.
 */
export function ClearCart() {
  useEffect(() => {
    cartActions.clear();
  }, []);
  return null;
}
