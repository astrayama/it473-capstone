import Form from "next/form";
import { listCustomers } from "@/lib/customers";
import { customerStatusLabels, formatDate } from "@/lib/format";
import { CustomerStatusButtons } from "@/components/admin/customer-status-buttons";
import { CustomerStatusBadge } from "@/components/order-status-badge";
import { Pagination } from "@/components/pagination";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import type { CustomerStatus } from "@/generated/prisma/client";

export default async function AdminCustomersPage(props: PageProps<"/admin/customers">) {
  const sp = await props.searchParams;
  const page = Number(sp.page) || 1;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = typeof sp.status === "string" && sp.status in customerStatusLabels ? (sp.status as CustomerStatus) : undefined;
  const { rows, total, pages } = await listCustomers({ page, q, status });

  return (
    <>
      <AdminPageHeader
        eyebrow="Accounts"
        title="Customers"
        actions={
          <Form action="/admin/customers" className="flex flex-wrap gap-2">
            <input name="q" defaultValue={q} placeholder="Business, contact, email, city" aria-label="Search customers" className="input w-64" />
            <select name="status" defaultValue={status ?? ""} className="input w-44" aria-label="Filter by status">
              <option value="">All statuses</option>
              {Object.entries(customerStatusLabels).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <button className="btn-secondary" type="submit">Search</button>
          </Form>
        }
      />
      <div className="card p-0">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Business</th><th>Contact</th><th>Location</th><th>Since</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.businessName}</td>
                  <td>
                    <div>{c.contactName}</div>
                    <div className="meta text-xs">{c.email}{c.phone ? ` · ${c.phone}` : ""}</div>
                  </td>
                  <td>{c.city}, {c.state}</td>
                  <td className="whitespace-nowrap">{formatDate(c.createdAt)}</td>
                  <td><CustomerStatusBadge status={c.status} /></td>
                  <td><CustomerStatusButtons customerId={c.id} status={c.status} /></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="meta py-10 text-center">No customers match.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line p-5">
          <Pagination page={page} pages={pages} total={total} basePath="/admin/customers" query={{ q, status }} />
        </div>
      </div>
    </>
  );
}
