import { NextResponse } from "next/server";
import { canOrder } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleRouteError, jsonError, requireCustomerApi } from "@/lib/api";
import { checkoutSchema } from "@/lib/validation";
import { createOrderFromCart } from "@/lib/orders";
import { getProductsByIds } from "@/lib/catalog";
import { orderNumber } from "@/lib/format";
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

    // Stripe fetches line-item photos itself, so only send them when the site is public (https).
    const products = await getProductsByIds(order.items.map((i) => i.productId));
    const publicSite = base.startsWith("https://");
    const number = orderNumber(order.orderNumber);

    const checkout = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: session.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: String(order.orderNumber) },
      payment_intent_data: {
        description: `${siteConfig.name} order ${number}`,
        metadata: { orderId: order.id, orderNumber: String(order.orderNumber) },
      },
      custom_text: {
        submit: { message: `Order ${number} for ${session.customer!.businessName}. Delivery and applicable taxes are confirmed on your invoice.` },
      },
      line_items: order.items.map((item) => {
        const product = products.get(item.productId);
        const detail = [product?.packSize, `per ${item.packSize}`, item.sku].filter(Boolean).join(" · ");
        return {
          quantity: item.quantity,
          price_data: {
            currency: siteConfig.currency,
            unit_amount: item.casePriceCents,
            product_data: {
              name: item.name,
              description: detail,
              ...(publicSite && product?.imageUrl ? { images: [`${base}${product.imageUrl}`] } : {}),
            },
          },
        };
      }),
      success_url: `${base}/checkout/success?order=${order.id}`,
      cancel_url: `${base}/cart?cancelled=1`,
    });
    await db().order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: checkout.id } });
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    return handleRouteError(err);
  }
}
