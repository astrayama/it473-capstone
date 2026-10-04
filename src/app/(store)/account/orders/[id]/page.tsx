import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncStripePayment } from "@/lib/orders";
import { OrderSummary } from "@/components/order-summary";
import { ArrowLeft } from "@/components/icons";
import { PageTransition } from "@/components/page-transition";

export default async function AccountOrderPage(props: PageProps<"/account/orders/[id]">) {
  const { id } = await props.params;
  const session = await requireSession(`/account/orders/${id}`);
  const found = await db().order.findUnique({ where: { id }, include: { items: true, customer: true } });
  if (!found || found.customerId !== session.customer?.id) notFound();
  const order = (await syncStripePayment(found))
    ? (await db().order.findUnique({ where: { id }, include: { items: true, customer: true } }))!
    : found;

  return (
    <PageTransition>
      <div className="container-page max-w-3xl space-y-8 py-16 md:py-20">
        <Link href="/account/orders" className="meta inline-flex items-center gap-2 transition-colors hover:text-fg">
          <ArrowLeft width={14} height={14} /> Order history
        </Link>
        <OrderSummary order={order} />
      </div>
    </PageTransition>
  );
}
