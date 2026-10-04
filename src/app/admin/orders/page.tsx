import Link from "next/link";
import Form from "next/form";
import { listOrders } from "@/lib/orders";
import { formatCents, formatDate, formatDateTime, orderNumber, orderStatusLabels } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Pagination } from "@/components/pagination";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import type { OrderStatus } from "@/generated/prisma/client";

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  const sp = await props.searchParams;
  const page = Number(sp.page) || 1;
  const status = typeof sp.status === "string" && sp.status in orderStatusLabels ? (sp.status as OrderStatus) : undefined;
  const { rows, total, pages } = await listOrders({ page, status });

  return (
    <>
      <AdminPageHeader
        eyebrow="Fulfilment"
        title="Orders"
        actions={
          <Form action="/admin/orders" className="flex gap-2">
            <select name="status" defaultValue={status ?? ""} className="input w-48" aria-label="Filter by status">
              <option value="">All statuses</option>
              {Object.entries(orderStatusLabels).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <button className="btn-secondary" type="submit">Filter</button>
          </Form>
        }
      />
      <div className="card p-0">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Delivery</th><th>Status</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`} className="link numeric font-medium">{orderNumber(o.orderNumber)}</Link></td>
                  <td>{o.customer.businessName}</td>
                  <td className="whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                  <td className="whitespace-nowrap">{o.requestedDeliveryDate ? formatDate(o.requestedDeliveryDate) : "—"}</td>
                  <td><OrderStatusBadge status={o.status} /></td>
                  <td className="text-right">{formatCents(o.totalCents)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="meta py-10 text-center">No orders.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line p-5">
          <Pagination page={page} pages={pages} total={total} basePath="/admin/orders" query={{ status }} />
        </div>
      </div>
    </>
  );
}
