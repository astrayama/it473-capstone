import "server-only";
import Stripe from "stripe";

let client: Stripe | undefined;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  client ??= new Stripe(key);
  return client;
}

/** True when the configured key is a Stripe test-mode key (sk_test_… / rk_test_…). */
export function isStripeTestMode(): boolean {
  return /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? "");
}

export interface CheckoutPayment {
  paid: boolean;
  checkoutSessionId: string;
  paymentIntentId: string | null;
}

/**
 * Asks Stripe directly whether a Checkout Session has been paid. Used on the confirmation
 * page so customers see "Paid" right away instead of waiting for the webhook; the webhook
 * remains the source of truth for everyone else (and is idempotent with this).
 */
export async function getCheckoutPayment(checkoutSessionId: string): Promise<CheckoutPayment> {
  const s = await stripe().checkout.sessions.retrieve(checkoutSessionId);
  return {
    paid: s.payment_status === "paid" || s.payment_status === "no_payment_required",
    checkoutSessionId: s.id,
    paymentIntentId: typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null),
  };
}
