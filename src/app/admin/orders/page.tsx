import Link from "next/link";
import { listOrders } from "@/lib/orders";
import { formatCents, formatDateTime, orderNumber, orderStatusLabels } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Pagination } from "@/components/pagination";
import type { OrderStatus } from "@/generated/prisma/client";

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  const sp = await props.searchParams;
  const page = Number(sp.page) || 1;
  const status = typeof sp.status === "string" && sp.status in orderStatusLabels ? (sp.status as OrderStatus) : undefined;
  const { rows, total, pages } = await listOrders({ page, status });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Orders</h2>
        <form action="/admin/orders" method="get" className="flex gap-2">
          <select name="status" defaultValue={status ?? ""} className="input w-48">
            <option value="">All statuses</option>
            {Object.entries(orderStatusLabels).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <button className="btn-secondary" type="submit">Filter</button>
        </form>
      </div>
      <div className="card p-0">
        <table className="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Delivery</th><th>Status</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{orderNumber(o.orderNumber)}</Link></td>
                <td>{o.customer.businessName}</td>
                <td>{formatDateTime(o.createdAt)}</td>
                <td>{o.requestedDeliveryDate ? formatDateTime(o.requestedDeliveryDate).split(",")[0] : "—"}</td>
                <td><OrderStatusBadge status={o.status} /></td>
                <td className="text-right">{formatCents(o.totalCents)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-neutral-500">No orders.</td></tr>}
          </tbody>
        </table>
        <div className="p-4">
          <Pagination page={page} pages={pages} total={total} basePath="/admin/orders" query={{ status }} />
        </div>
      </div>
    </div>
  );
}
