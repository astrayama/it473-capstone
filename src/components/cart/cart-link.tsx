"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-store";
import { Crate } from "@/components/icons";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-2 text-sm text-fg-2 transition-colors hover:text-fg"
      aria-label={count ? `Your order, ${count} ${count === 1 ? "unit" : "units"}` : "Your order"}
    >
      <Crate />
      <span
        key={count}
        className="cart-count numeric inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[0.6875rem] leading-5 font-medium text-on-accent"
        hidden={count === 0}
      >
        {count}
      </span>
    </Link>
  );
}
