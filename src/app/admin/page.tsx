import Link from "next/link";
import { db } from "@/lib/db";
import { countProducts } from "@/lib/catalog";
import { lowStockCount } from "@/lib/inventory";
import { listOrders } from "@/lib/orders";
import { formatCents, formatDateTime, orderNumber, orderStatusLabels } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

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
    { label: "Products in the catalog", value: products, href: "/admin/products" },
    { label: "Low-stock items", value: lowStock, href: "/admin/inventory", warn: lowStock > 0 },
    { label: "Accounts awaiting approval", value: pendingCustomers, href: "/admin/customers?status=PENDING", warn: pendingCustomers > 0 },
    { label: "Orders to fulfil", value: count("PAID") + count("CONFIRMED"), href: "/admin/orders?status=PAID" },
  ];

  return (
    <>
      <AdminPageHeader eyebrow="Staff" title="Dashboard" description="Today's catalog, stock, accounts and orders at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card group flex flex-col gap-4 transition-shadow hover:shadow-lift">
            <div className="flex items-start justify-between gap-3">
              <span className="numeric font-display text-5xl leading-none">{t.value}</span>
              {t.warn && <span className="badge badge-dot badge-warning">Needs attention</span>}
            </div>
            <span className="text-sm text-fg-2 group-hover:text-fg">{t.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section className="card p-0">
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h2 className="text-title-m">Latest orders</h2>
            <Link href="/admin/orders" className="link text-sm text-fg-2">All orders</Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Status</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {recent.rows.slice(0, 8).map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/orders/${o.id}`} className="link numeric font-medium">{orderNumber(o.orderNumber)}</Link></td>
                    <td>{o.customer.businessName}</td>
                    <td className="whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                    <td><OrderStatusBadge status={o.status} /></td>
                    <td className="text-right">{formatCents(o.totalCents)}</td>
                  </tr>
                ))}
                {recent.rows.length === 0 && <tr><td colSpan={5} className="meta py-8 text-center">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card text-sm">
          <h2 className="text-title-m mb-4">By status</h2>
          <ul className="divide-y divide-line">
            {Object.entries(orderStatusLabels).map(([k, label]) => (
              <li key={k} className="flex items-center justify-between py-2.5">
                <Link href={`/admin/orders?status=${k}`} className="text-fg-2 hover:text-fg">{label}</Link>
                <span className="numeric font-medium">{count(k)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
