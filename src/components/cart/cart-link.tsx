"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-store";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="relative inline-flex items-center gap-1 text-sm font-medium hover:text-brand-700">
      Cart
      <span className="badge bg-brand-600 text-white">{count}</span>
    </Link>
  );
}
