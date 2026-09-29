import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { orderNumber } from "@/lib/format";
import { OrderSummary } from "@/components/order-summary";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ArrowLeft } from "@/components/icons";

export default async function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  const order = await db().order.findUnique({ where: { id }, include: { items: true, customer: true } });
  if (!order) notFound();

  return (
    <>
      <Link href="/admin/orders" className="meta mb-6 inline-flex items-center gap-2 hover:text-fg">
        <ArrowLeft width={14} height={14} /> All orders
      </Link>
      <AdminPageHeader eyebrow="Order" title={<span className="numeric">{orderNumber(order.orderNumber)}</span>} description={order.customer.businessName} />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <OrderSummary order={order} showCustomer />
        <div className="card space-y-4 lg:sticky lg:top-8">
          <h2 className="text-title-m">Update status</h2>
          <OrderStatusSelect orderId={order.id} status={order.status} />
          {order.stripePaymentIntentId && (
            <p className="meta break-all">Stripe payment: {order.stripePaymentIntentId}</p>
          )}
        </div>
      </div>
    </>
  );
}
