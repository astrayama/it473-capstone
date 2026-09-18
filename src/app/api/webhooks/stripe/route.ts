import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api";

/**
 * Stripe -> us. Configure the endpoint in the Stripe dashboard as
 * https://<your-domain>/api/webhooks/stripe with event `checkout.session.completed`
 * (and optionally `checkout.session.expired`).
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !isStripeConfigured()) return jsonError(503, "Stripe webhook is not configured.");
  const signature = req.headers.get("stripe-signature");
  if (!signature) return jsonError(400, "Missing stripe-signature header.");

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch (err) {
    return jsonError(400, `Invalid signature: ${(err as Error).message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      const orderId = s.metadata?.orderId ?? s.client_reference_id;
      if (orderId) {
        await markOrderPaid(orderId, {
          checkoutSessionId: s.id,
          paymentIntentId: typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null),
        });
      }
      break;
    }
    case "checkout.session.expired": {
      const s = event.data.object;
      const orderId = s.metadata?.orderId ?? s.client_reference_id;
      if (orderId) {
        await db().order.updateMany({ where: { id: orderId, status: "PENDING_PAYMENT" }, data: { status: "CANCELLED" } });
      }
      break;
    }
    default:
      break;
  }
  return NextResponse.json({ received: true });
}
