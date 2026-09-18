import Link from "next/link";
import { db } from "@/lib/db";
import { countProducts } from "@/lib/catalog";
import { lowStockCount } from "@/lib/inventory";
import { listOrders } from "@/lib/orders";
import { formatCents, formatDateTime, orderNumber, orderStatusLabels } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";

export default async function AdminDashboard() {
  const [products, lowStock, pendingCustomers, byStatus, recent] = await Promise.all([
    countProducts(),
    lowStockCount(),
    db().customer.count({ where: { status: "PENDING" } }),
    db().order.groupBy({ by: ["status"], _count: { _all: true } }),
    listOrders({ page: 1 }),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;

  const tiles = [
    { label: "Products in catalog", value: products, href: "/admin/products" },
    { label: "Low-stock items", value: lowStock, href: "/admin/inventory", warn: lowStock > 0 },
    { label: "Customers awaiting approval", value: pendingCustomers, href: "/admin/customers?status=PENDING", warn: pendingCustomers > 0 },
    { label: "Orders to fulfil", value: count("PAID") + count("CONFIRMED"), href: "/admin/orders?status=PAID" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className={`card hover:border-brand-300 ${t.warn ? "border-amber-300 bg-amber-50" : ""}`}>
            <div className="text-3xl font-bold">{t.value}</div>
            <div className="text-sm text-neutral-600">{t.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="card p-0">
          <div className="flex items-center justify-between p-4">
            <h2 className="font-semibold">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm text-brand-700 underline">All orders</Link>
          </div>
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Status</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {recent.rows.slice(0, 8).map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{orderNumber(o.orderNumber)}</Link></td>
                  <td>{o.customer.businessName}</td>
                  <td>{formatDateTime(o.createdAt)}</td>
                  <td><OrderStatusBadge status={o.status} /></td>
                  <td className="text-right">{formatCents(o.totalCents)}</td>
                </tr>
              ))}
              {recent.rows.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-neutral-500">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="card text-sm">
          <h2 className="mb-2 font-semibold">Orders by status</h2>
          <ul className="space-y-1">
            {Object.entries(orderStatusLabels).map(([k, label]) => (
              <li key={k} className="flex justify-between">
                <span className="text-neutral-600">{label}</span>
                <span className="font-medium">{count(k)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
