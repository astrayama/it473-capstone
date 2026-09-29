import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderSummary } from "@/components/order-summary";
import { ArrowLeft } from "@/components/icons";
import { PageTransition } from "@/components/page-transition";

export default async function AccountOrderPage(props: PageProps<"/account/orders/[id]">) {
  const { id } = await props.params;
  const session = await requireSession(`/account/orders/${id}`);
  const order = await db().order.findUnique({ where: { id }, include: { items: true, customer: true } });
  if (!order || order.customerId !== session.customer?.id) notFound();

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
