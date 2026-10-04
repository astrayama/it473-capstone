import { formatCents, formatDate, formatDateTime, orderNumber, perUnit } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import type { OrderWithItems } from "@/lib/orders";

export function OrderSummary({ order, showCustomer = false }: { order: OrderWithItems; showCustomer?: boolean }) {
  return (
    <div className="card space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-title-m">Order <span className="numeric">{orderNumber(order.orderNumber)}</span></h2>
          <p className="meta mt-1">Placed {formatDateTime(order.createdAt)}</p>
          {order.requestedDeliveryDate && (
            <p className="meta">Requested delivery: {formatDate(order.requestedDeliveryDate)}</p>
          )}
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      {showCustomer && (
        <div className="rule pt-5 text-sm">
          <div className="font-medium">{order.customer.businessName}</div>
          <div className="text-fg-2">
            {order.customer.contactName} · {order.customer.email}{order.customer.phone ? ` · ${order.customer.phone}` : ""}
          </div>
          <div className="text-fg-2">
            {order.customer.addressLine1}{order.customer.addressLine2 ? `, ${order.customer.addressLine2}` : ""}, {order.customer.city}, {order.customer.state} {order.customer.postalCode}
          </div>
        </div>
      )}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Item</th><th>Price</th><th>Qty</th><th className="text-right">Total</th></tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}>
                <td>
                  <div className="font-medium">{i.name}</div>
                  <div className="meta">{perUnit(i.packSize)} · <span className="numeric">{i.sku}</span></div>
                </td>
                <td>{formatCents(i.casePriceCents)}</td>
                <td>{i.quantity}</td>
                <td className="text-right">{formatCents(i.lineTotalCents)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-right text-eyebrow font-medium tracking-label text-fg-3 uppercase">Total</td>
              <td className="price text-right text-xl">{formatCents(order.totalCents)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {order.notes && (
        <p className="text-sm"><span className="font-medium">Notes:</span> <span className="text-fg-2">{order.notes}</span></p>
      )}
    </div>
  );
}
