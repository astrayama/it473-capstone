import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import { formatCents, formatDateTime, orderNumber } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Pagination } from "@/components/pagination";

export const metadata: Metadata = { title: "Orders" };

export default async function AccountOrdersPage(props: PageProps<"/account/orders">) {
  const sp = await props.searchParams;
  const session = await requireSession("/account/orders");
  if (!session.customer) redirect("/account");
  const page = Number(sp.page) || 1;
  const { rows, total, pages } = await listOrders({ customerId: session.customer.id, page });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Order history</h1>
      <div className="card p-0">
        <table className="table">
          <thead><tr><th>Order</th><th>Placed</th><th>Items</th><th>Status</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/account/orders/${o.id}`} className="font-medium hover:underline">{orderNumber(o.orderNumber)}</Link></td>
                <td>{formatDateTime(o.createdAt)}</td>
                <td>{o.items.reduce((n, i) => n + i.quantity, 0)} cases</td>
                <td><OrderStatusBadge status={o.status} /></td>
                <td className="text-right">{formatCents(o.totalCents)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-neutral-500">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
        <div className="p-4">
          <Pagination page={page} pages={pages} total={total} basePath="/account/orders" />
        </div>
      </div>
    </div>
  );
}
