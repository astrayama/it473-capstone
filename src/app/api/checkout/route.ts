import { NextResponse } from "next/server";
import { canOrder } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleRouteError, jsonError, requireCustomerApi } from "@/lib/api";
import { checkoutSchema } from "@/lib/validation";
import { createOrderFromCart } from "@/lib/orders";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { siteConfig, siteUrl } from "@/config/site";

/**
 * Turns the cart into an order and (when Stripe is configured) a Stripe Checkout
 * session. Returns { url } for the browser to navigate to.
 */
export async function POST(req: Request) {
  try {
    const session = await requireCustomerApi();
    if (session instanceof NextResponse) return session;
    if (!canOrder(session)) return jsonError(403, "Your account must be approved before you can order.");

    const body = checkoutSchema.parse(await req.json());
    const order = await createOrderFromCart(session.customer!.id, body.items, {
      notes: body.notes,
      requestedDeliveryDate: body.requestedDeliveryDate || undefined,
    });
    const base = siteUrl();

    if (!isStripeConfigured()) {
      return NextResponse.json({ url: `${base}/checkout/success?order=${order.id}&payment=skipped` });
    }

    const checkout = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: session.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: String(order.orderNumber) },
      line_items: order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: siteConfig.currency,
          unit_amount: item.casePriceCents,
          product_data: { name: item.name, description: `Per ${item.packSize} · ${item.sku}` },
        },
      })),
      success_url: `${base}/checkout/success?order=${order.id}`,
      cancel_url: `${base}/cart?cancelled=1`,
    });
    await db().order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: checkout.id } });
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    return handleRouteError(err);
  }
}
