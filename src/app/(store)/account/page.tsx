import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import { formatCents, formatDateTime, orderNumber } from "@/lib/format";
import { CustomerStatusBadge, OrderStatusBadge } from "@/components/order-status-badge";
import { SectionHeading } from "@/components/section-heading";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage(props: PageProps<"/account">) {
  const sp = await props.searchParams;
  const session = await requireSession("/account");
  const customer = session.customer;

  if (!customer) {
    return (
      <div className="container-page max-w-2xl py-16 md:py-24">
        <EmptyState
          title="No wholesale account linked"
          action={
            session.isAdmin ? (
              <Link href="/admin" className="btn-primary">Go to the staff admin</Link>
            ) : (
              <Link href="/register" className="btn-primary">Complete your application</Link>
            )
          }
        >
          You are signed in as {session.email}, but this login isn&apos;t linked to a customer account.
        </EmptyState>
      </div>
    );
  }

  const { rows: recent } = await listOrders({ customerId: customer.id, page: 1 });

  return (
    <div className="container-page py-16 md:py-20">
      {sp.welcome === "1" && (
        <p className="alert-success mb-10">Thank you for applying. We review new accounts within one business day.</p>
      )}
      <SectionHeading
        as="h1"
        size="l"
        eyebrow="Your account"
        title={customer.businessName}
        lede={`${customer.contactName} · ${customer.email}`}
        action={<CustomerStatusBadge status={customer.status} />}
      />

      <div className="mt-14 grid items-start gap-10 md:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="card text-sm leading-7">
          <p className="eyebrow mb-4">Delivery address</p>
          <div>{customer.addressLine1}</div>
          {customer.addressLine2 && <div>{customer.addressLine2}</div>}
          <div>{customer.city}, {customer.state} {customer.postalCode}</div>
          {customer.phone && <div className="mt-3 text-fg-2">{customer.phone}</div>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-title-m">Recent orders</h2>
            <Link href="/account/orders" className="link text-sm text-fg-2">All orders</Link>
          </div>
          {recent.length === 0 ? (
            <p className="meta mt-6">No orders yet.</p>
          ) : (
            <div className="table-wrap mt-4">
              <table className="table">
                <thead><tr><th>Order</th><th>Placed</th><th>Status</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {recent.slice(0, 5).map((o) => (
                    <tr key={o.id}>
                      <td><Link href={`/account/orders/${o.id}`} className="link numeric font-medium">{orderNumber(o.orderNumber)}</Link></td>
                      <td>{formatDateTime(o.createdAt)}</td>
                      <td><OrderStatusBadge status={o.status} /></td>
                      <td className="text-right">{formatCents(o.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
