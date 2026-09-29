"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Shopping cart kept in localStorage (one per browser). Prices shown here are for
 * display only; the server re-prices every line from Firestore at checkout.
 */
export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  unitOfMeasure: string;
  category: string;
  priceCents: number;
  imageUrl: string | null;
  quantity: number;
}

const STORAGE_KEY = "pcf-cart-v2";
/** Carts saved before the Firestore `catalog` schema; their fields no longer line up. */
const LEGACY_KEYS = ["pcf-cart-v1"];
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;

function isCartItem(value: unknown): value is CartItem {
  const v = value as Partial<CartItem> | null;
  return (
    typeof v?.productId === "string" &&
    typeof v.sku === "string" &&
    typeof v.name === "string" &&
    typeof v.unitOfMeasure === "string" &&
    typeof v.priceCents === "number" &&
    typeof v.quantity === "number" &&
    v.quantity > 0
  );
}

function read(): CartItem[] {
  if (cache) return cache;
  try {
    LEGACY_KEYS.forEach((k) => window.localStorage.removeItem(k));
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.filter(isCartItem) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(items: CartItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable (private mode) — cart lives in memory only
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const cartActions = {
  add(item: Omit<CartItem, "quantity">, quantity = 1) {
    const items = read();
    const existing = items.find((i) => i.productId === item.productId);
    if (existing) {
      write(items.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i)));
    } else {
      write([...items, { ...item, quantity }]);
    }
  },
  setQuantity(productId: string, quantity: number) {
    const items = read();
    if (quantity <= 0) {
      write(items.filter((i) => i.productId !== productId));
    } else {
      write(items.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
    }
  },
  remove(productId: string) {
    write(read().filter((i) => i.productId !== productId));
  },
  clear() {
    write(EMPTY);
  },
};

export function useCart() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  return useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotalCents: items.reduce((n, i) => n + i.priceCents * i.quantity, 0),
      ...cartActions,
    }),
    [items],
  );
}
