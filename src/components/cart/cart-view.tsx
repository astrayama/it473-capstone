"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-store";
import { ProductImage } from "@/components/product-image";
import { formatCents, perUnit } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";

interface Props {
  signedIn: boolean;
  canOrder: boolean;
  accountStatus: string | null;
  stripeConfigured: boolean;
  cancelled?: boolean;
}

export function CartView({ signedIn, canOrder, accountStatus, stripeConfigured, cancelled }: Props) {
  const cart = useCart();
  const [notes, setNotes] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function placeOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          notes,
          requestedDeliveryDate: deliveryDate,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not place the order.");
      cart.clear();
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState title="Your order is empty." action={<Link href="/catalog" className="btn-primary">Enter the catalog</Link>}>
        Add provisions from the catalog and they will wait for you here.
      </EmptyState>
    );
  }

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div>
        {cancelled && <p className="alert-info mb-6">Payment was cancelled. Your order is still here.</p>}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th className="text-right">Total</th>
                <th><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.productId}>
                  <td>
                    <div className="flex items-center gap-4">
                      <ProductImage src={item.imageUrl} alt="" aspect="1/1" sizes="56px" className="w-14 shrink-0 rounded-sm" />
                      <div>
                        <Link href={`/catalog/${encodeURIComponent(item.productId)}`} className="font-display text-xl leading-tight transition-colors hover:text-accent-ink">
                          {item.name}
                        </Link>
                        <div className="meta mt-1">{perUnit(item.unitOfMeasure)} · <span className="numeric">{item.sku}</span></div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">{formatCents(item.priceCents)}</td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => cart.setQuantity(item.productId, Number(e.target.value) || 0)}
                      className="input numeric w-20 text-center"
                      aria-label={`Quantity of ${item.name}`}
                    />
                  </td>
                  <td className="text-right font-medium whitespace-nowrap">{formatCents(item.priceCents * item.quantity)}</td>
                  <td className="text-right">
                    <button type="button" onClick={() => cart.remove(item.productId)} className="btn-ghost btn-sm text-danger-ink">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="card glass space-y-5 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]" aria-label="Order summary">
        <p className="eyebrow">Summary</p>
        <div className="flex items-baseline justify-between">
          <span className="text-fg-2">Subtotal</span>
          <span className="price text-3xl">{formatCents(cart.subtotalCents)}</span>
        </div>
        <p className="meta">Delivery and applicable taxes are confirmed on your invoice.</p>

        {!signedIn && (
          <div className="alert-info">
            <Link href="/login?next=/cart" className="link font-medium">Sign in</Link> to place a wholesale order, or{" "}
            <Link href="/register" className="link font-medium">apply for an account</Link>.
          </div>
        )}
        {signedIn && !canOrder && (
          <div className="alert-info">
            {accountStatus === "PENDING"
              ? "Your account is waiting for approval. You can order as soon as our team approves it."
              : accountStatus === "SUSPENDED"
                ? "Your account is suspended. Please contact us."
                : "This login is not linked to a wholesale account."}
          </div>
        )}

        {canOrder && (
          <>
            <div>
              <label className="label" htmlFor="delivery">Requested delivery date (optional)</label>
              <input id="delivery" type="date" className="input" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="notes">Order notes (optional)</label>
              <textarea id="notes" className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dock hours, substitutions, PO number…" />
            </div>
            {!stripeConfigured && (
              <p className="meta">Payments are not configured on this environment; the order will be recorded as pending payment.</p>
            )}
            {error && <p className="alert-error" role="alert">{error}</p>}
            <button type="button" onClick={placeOrder} disabled={submitting} className="btn-primary btn-lg w-full">
              {submitting ? "Placing order…" : stripeConfigured ? "Continue to payment" : "Place order"}
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
