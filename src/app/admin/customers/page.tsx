import { listCustomers } from "@/lib/customers";
import { customerStatusLabels, formatDate } from "@/lib/format";
import { CustomerStatusButtons } from "@/components/admin/customer-status-buttons";
import { Pagination } from "@/components/pagination";
import type { CustomerStatus } from "@/generated/prisma/client";

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-brand-100 text-brand-800",
  SUSPENDED: "bg-red-100 text-red-800",
};

export default async function AdminCustomersPage(props: PageProps<"/admin/customers">) {
  const sp = await props.searchParams;
  const page = Number(sp.page) || 1;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = typeof sp.status === "string" && sp.status in customerStatusLabels ? (sp.status as CustomerStatus) : undefined;
  const { rows, total, pages } = await listCustomers({ page, q, status });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Customers</h2>
        <form action="/admin/customers" method="get" className="flex flex-wrap gap-2">
          <input name="q" defaultValue={q} placeholder="Search business, contact, email, city" className="input w-64" />
          <select name="status" defaultValue={status ?? ""} className="input w-44">
            <option value="">All statuses</option>
            {Object.entries(customerStatusLabels).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <button className="btn-secondary" type="submit">Search</button>
        </form>
      </div>
      <div className="card p-0">
        <table className="table">
          <thead><tr><th>Business</th><th>Contact</th><th>Location</th><th>Since</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.businessName}</td>
                <td>
                  <div>{c.contactName}</div>
                  <div className="text-xs text-neutral-500">{c.email}{c.phone ? ` · ${c.phone}` : ""}</div>
                </td>
                <td>{c.city}, {c.state}</td>
                <td>{formatDate(c.createdAt)}</td>
                <td><span className={`badge ${statusColor[c.status]}`}>{customerStatusLabels[c.status]}</span></td>
                <td><CustomerStatusButtons customerId={c.id} status={c.status} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-neutral-500">No customers match.</td></tr>}
          </tbody>
        </table>
        <div className="p-4">
          <Pagination page={page} pages={pages} total={total} basePath="/admin/customers" query={{ q, status }} />
        </div>
      </div>
    </div>
  );
}
