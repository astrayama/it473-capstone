"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-store";
import { ProductImage } from "@/components/product-image";
import { formatCents } from "@/lib/format";

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
      <div className="card text-center">
        <p className="text-neutral-600">Your cart is empty.</p>
        <Link href="/catalog" className="btn-primary mt-4">Browse the catalog</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card p-0">
        {cancelled && <p className="alert-info m-4">Payment was cancelled. Your cart is still here.</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Case price</th>
              <th>Cases</th>
              <th className="text-right">Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cart.items.map((item) => (
              <tr key={item.productId}>
                <td>
                  <div className="flex items-center gap-3">
                    <ProductImage src={item.imageUrl} category={item.category} alt="" size={48} />
                    <div>
                      <Link href={`/catalog/${item.slug}`} className="font-medium hover:underline">{item.name}</Link>
                      <div className="text-xs text-neutral-500">{item.packSize} · SKU {item.sku}</div>
                    </div>
                  </div>
                </td>
                <td>{formatCents(item.casePriceCents)}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) => cart.setQuantity(item.productId, Number(e.target.value) || 0)}
                    className="input w-20"
                    aria-label={`Cases of ${item.name}`}
                  />
                </td>
                <td className="text-right font-medium">{formatCents(item.casePriceCents * item.quantity)}</td>
                <td className="text-right">
                  <button type="button" onClick={() => cart.remove(item.productId)} className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <aside className="card h-fit space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-neutral-600">Subtotal</span>
          <span className="text-xl font-semibold">{formatCents(cart.subtotalCents)}</span>
        </div>
        <p className="text-xs text-neutral-500">Delivery and applicable taxes are confirmed on your invoice.</p>

        {!signedIn && (
          <div className="alert-info">
            <Link href="/login?next=/cart" className="font-medium underline">Sign in</Link> to place a wholesale order, or{" "}
            <Link href="/register" className="font-medium underline">apply for an account</Link>.
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
              <p className="text-xs text-neutral-500">
                Payments are not configured on this environment; the order will be recorded as pending payment.
              </p>
            )}
            {error && <p className="alert-error">{error}</p>}
            <button type="button" onClick={placeOrder} disabled={submitting} className="btn-primary w-full">
              {submitting ? "Placing order…" : stripeConfigured ? "Continue to payment" : "Place order"}
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
