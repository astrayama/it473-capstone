import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderSummary } from "@/components/order-summary";

export default async function CheckoutSuccessPage(props: PageProps<"/checkout/success">) {
  const sp = await props.searchParams;
  const orderId = typeof sp.order === "string" ? sp.order : "";
  const session = await requireSession(`/checkout/success?order=${orderId}`);
  const order = await db().order.findUnique({ where: { id: orderId }, include: { items: true, customer: true } });
  if (!order || (order.customerId !== session.customer?.id && !session.isAdmin)) notFound();

  return (
    <div className="container-page max-w-3xl space-y-6 py-8">
      <div className="card space-y-2">
        <h1 className="text-2xl font-bold text-brand-800">Thank you! Your order is in.</h1>
        {sp.payment === "skipped" ? (
          <p className="text-sm text-neutral-700">
            Payment processing is not configured on this environment, so the order was recorded as <strong>pending payment</strong>.
            Our team will confirm it with you.
          </p>
        ) : (
          <p className="text-sm text-neutral-700">
            Payment is being confirmed. The status below updates automatically once Stripe notifies us.
          </p>
        )}
        <Link href="/account/orders" className="text-sm font-medium text-brand-700 underline">View all orders</Link>
      </div>
      <OrderSummary order={order} />
    </div>
  );
}
