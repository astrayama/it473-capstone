import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderSummary } from "@/components/order-summary";

export default async function AccountOrderPage(props: PageProps<"/account/orders/[id]">) {
  const { id } = await props.params;
  const session = await requireSession(`/account/orders/${id}`);
  const order = await db().order.findUnique({ where: { id }, include: { items: true, customer: true } });
  if (!order || order.customerId !== session.customer?.id) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/account/orders" className="text-sm text-neutral-500 hover:underline">‹ Order history</Link>
      <OrderSummary order={order} />
    </div>
  );
}
