import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncStripePayment } from "@/lib/orders";
import { ClearCart } from "@/components/cart/clear-cart";
import { OrderSummary } from "@/components/order-summary";
import { CrestMark } from "@/components/brand/crest";
import { PageTransition } from "@/components/page-transition";

export default async function CheckoutSuccessPage(props: PageProps<"/checkout/success">) {
  const sp = await props.searchParams;
  const orderId = typeof sp.order === "string" ? sp.order : "";
  const session = await requireSession(`/checkout/success?order=${orderId}`);
  const found = await db().order.findUnique({ where: { id: orderId }, include: { items: true, customer: true } });
  if (!found || (found.customerId !== session.customer?.id && !session.isAdmin)) notFound();
  // Don't make the buyer wait for the webhook: ask Stripe directly, then re-read the order.
  const order = (await syncStripePayment(found))
    ? (await db().order.findUnique({ where: { id: orderId }, include: { items: true, customer: true } }))!
    : found;
  const paid = order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED";

  return (
    <PageTransition>
      <div className="container-page max-w-3xl py-16 md:py-24">
        <ClearCart />
        <div className="text-center">
          <CrestMark className="seal mx-auto size-20 text-accent-ink" />
          <p className="eyebrow mt-8">Order received</p>
          <h1 className="display-l mt-4">Thank you. <em className="text-accent-ink">It&apos;s in.</em></h1>
          <p className="lede mx-auto mt-6 max-w-xl">
            {sp.payment === "skipped"
              ? "Payment processing isn't configured on this environment, so the order was recorded as pending payment. Our team will confirm it with you."
              : paid
                ? "Payment received. Our team will confirm your delivery window."
                : "Your payment is still being confirmed with Stripe. This usually takes a few seconds."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {!paid && sp.payment !== "skipped" && (
              <Link href={`/checkout/success?order=${encodeURIComponent(order.id)}`} className="btn-primary">Check again</Link>
            )}
            <Link href="/account/orders" className="btn-secondary">View all orders</Link>
          </div>
        </div>
        <div className="mt-16">
          <OrderSummary order={order} />
        </div>
      </div>
    </PageTransition>
  );
}
