import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { OrderSummary } from "@/components/order-summary";
import { OrderStatusSelect } from "@/components/admin/order-status-select";

export default async function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  const order = await db().order.findUnique({ where: { id }, include: { items: true, customer: true } });
  if (!order) notFound();

  return (
    <div className="space-y-4">
      <Link href="/admin/orders" className="text-sm text-neutral-500 hover:underline">‹ All orders</Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <OrderSummary order={order} showCustomer />
        <div className="card h-fit space-y-3">
          <h3 className="font-semibold">Update status</h3>
          <OrderStatusSelect orderId={order.id} status={order.status} />
          {order.stripePaymentIntentId && (
            <p className="text-xs text-neutral-500">Stripe payment: {order.stripePaymentIntentId}</p>
          )}
        </div>
      </div>
    </div>
  );
}
