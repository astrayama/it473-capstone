import Link from "next/link";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/products", "Products"],
  ["/admin/inventory", "Inventory"],
  ["/admin/orders", "Orders"],
  ["/admin/customers", "Customers"],
] as const;

export function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
      {links.map(([href, label]) => (
        <Link key={href} href={href} className="btn-secondary btn-sm">
          {label}
        </Link>
      ))}
    </nav>
  );
}
