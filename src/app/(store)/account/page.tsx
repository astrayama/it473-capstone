import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import { customerStatusLabels, formatCents, formatDateTime, orderNumber } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-status-badge";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage(props: PageProps<"/account">) {
  const sp = await props.searchParams;
  const session = await requireSession("/account");
  const customer = session.customer;

  if (!customer) {
    return (
      <div className="container-page py-8"><div className="card mx-auto max-w-lg space-y-3">
        <h1 className="text-xl font-semibold">No wholesale account linked</h1>
        <p className="text-sm text-neutral-600">
          You are signed in as {session.email}, but this login is not linked to a customer account.
        </p>
        {session.isAdmin ? (
          <Link href="/admin" className="btn-primary">Go to the admin area</Link>
        ) : (
          <Link href="/register" className="btn-primary">Complete your application</Link>
        )}
      </div></div>
    );
  }

  const { rows: recent } = await listOrders({ customerId: customer.id, page: 1 });

  return (
    <div className="container-page space-y-6 py-8">
      {sp.welcome === "1" && (
        <p className="alert-info">Thanks for applying! We will review your account within one business day.</p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{customer.businessName}</h1>
          <p className="text-sm text-neutral-600">{customer.contactName} · {customer.email}</p>
        </div>
        <span className={`badge ${customer.status === "APPROVED" ? "bg-brand-100 text-brand-800" : "bg-amber-100 text-amber-800"}`}>
          {customerStatusLabels[customer.status]}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="card text-sm">
          <h2 className="mb-2 font-semibold">Delivery address</h2>
          <div>{customer.addressLine1}</div>
          {customer.addressLine2 && <div>{customer.addressLine2}</div>}
          <div>{customer.city}, {customer.state} {customer.postalCode}</div>
          {customer.phone && <div className="mt-2 text-neutral-600">{customer.phone}</div>}
        </div>
        <div className="card p-0">
          <div className="flex items-center justify-between p-4">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/account/orders" className="text-sm text-brand-700 underline">All orders</Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-neutral-600">No orders yet.</p>
          ) : (
            <table className="table">
              <thead><tr><th>Order</th><th>Placed</th><th>Status</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {recent.slice(0, 5).map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/account/orders/${o.id}`} className="font-medium hover:underline">{orderNumber(o.orderNumber)}</Link></td>
                    <td>{formatDateTime(o.createdAt)}</td>
                    <td><OrderStatusBadge status={o.status} /></td>
                    <td className="text-right">{formatCents(o.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
