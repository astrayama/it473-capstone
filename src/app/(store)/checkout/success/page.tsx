import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderSummary } from "@/components/order-summary";
import { CrestMark } from "@/components/brand/crest";
import { PageTransition } from "@/components/page-transition";

export default async function CheckoutSuccessPage(props: PageProps<"/checkout/success">) {
  const sp = await props.searchParams;
  const orderId = typeof sp.order === "string" ? sp.order : "";
  const session = await requireSession(`/checkout/success?order=${orderId}`);
  const order = await db().order.findUnique({ where: { id: orderId }, include: { items: true, customer: true } });
  if (!order || (order.customerId !== session.customer?.id && !session.isAdmin)) notFound();

  return (
    <PageTransition>
      <div className="container-page max-w-3xl py-16 md:py-24">
        <div className="text-center">
          <CrestMark className="seal mx-auto size-20 text-accent-ink" />
          <p className="eyebrow mt-8">Order received</p>
          <h1 className="display-l mt-4">Thank you. <em className="text-accent-ink">It&apos;s in.</em></h1>
          <p className="lede mx-auto mt-6 max-w-xl">
            {sp.payment === "skipped"
              ? "Payment processing isn't configured on this environment, so the order was recorded as pending payment. Our team will confirm it with you."
              : "Payment is being confirmed. The status below updates automatically once Stripe notifies us."}
          </p>
          <Link href="/account/orders" className="btn-secondary mt-8">View all orders</Link>
        </div>
        <div className="mt-16">
          <OrderSummary order={order} />
        </div>
      </div>
    </PageTransition>
  );
}
