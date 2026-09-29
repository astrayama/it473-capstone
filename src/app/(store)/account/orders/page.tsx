import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import { formatCents, formatDateTime, orderNumber } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Pagination } from "@/components/pagination";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = { title: "Orders" };

export default async function AccountOrdersPage(props: PageProps<"/account/orders">) {
  const sp = await props.searchParams;
  const session = await requireSession("/account/orders");
  if (!session.customer) redirect("/account");
  const page = Number(sp.page) || 1;
  const { rows, total, pages } = await listOrders({ customerId: session.customer.id, page });

  return (
    <div className="container-page py-16 md:py-20">
      <SectionHeading as="h1" size="l" eyebrow="Your account" title="Order history" />
      <div className="table-wrap mt-12">
        <table className="table">
          <thead><tr><th>Order</th><th>Placed</th><th>Units</th><th>Status</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/account/orders/${o.id}`} className="link numeric font-medium">{orderNumber(o.orderNumber)}</Link></td>
                <td>{formatDateTime(o.createdAt)}</td>
                <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td><OrderStatusBadge status={o.status} /></td>
                <td className="text-right">{formatCents(o.totalCents)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="meta py-10 text-center">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <Pagination page={page} pages={pages} total={total} basePath="/account/orders" />
      </div>
    </div>
  );
}
