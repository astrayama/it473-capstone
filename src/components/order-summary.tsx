import { formatCents, formatDate, formatDateTime, orderNumber, perUnit } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import type { OrderWithItems } from "@/lib/orders";

export function OrderSummary({ order, showCustomer = false }: { order: OrderWithItems; showCustomer?: boolean }) {
  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Order {orderNumber(order.orderNumber)}</h2>
          <p className="text-sm text-neutral-500">Placed {formatDateTime(order.createdAt)}</p>
          {order.requestedDeliveryDate && (
            <p className="text-sm text-neutral-500">Requested delivery: {formatDate(order.requestedDeliveryDate)}</p>
          )}
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      {showCustomer && (
        <div className="text-sm">
          <div className="font-medium">{order.customer.businessName}</div>
          <div className="text-neutral-600">
            {order.customer.contactName} · {order.customer.email}{order.customer.phone ? ` · ${order.customer.phone}` : ""}
          </div>
          <div className="text-neutral-600">
            {order.customer.addressLine1}{order.customer.addressLine2 ? `, ${order.customer.addressLine2}` : ""}, {order.customer.city}, {order.customer.state} {order.customer.postalCode}
          </div>
        </div>
      )}
      <table className="table">
        <thead>
          <tr><th>Item</th><th>Price</th><th>Qty</th><th className="text-right">Total</th></tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id}>
              <td>
                <div className="font-medium">{i.name}</div>
                <div className="text-xs text-neutral-500">{perUnit(i.packSize)} · {i.sku}</div>
              </td>
              <td>{formatCents(i.casePriceCents)}</td>
              <td>{i.quantity}</td>
              <td className="text-right">{formatCents(i.lineTotalCents)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="text-right font-medium">Total</td>
            <td className="text-right text-lg font-semibold">{formatCents(order.totalCents)}</td>
          </tr>
        </tfoot>
      </table>
      {order.notes && (
        <p className="text-sm"><span className="font-medium">Notes:</span> {order.notes}</p>
      )}
    </div>
  );
}
