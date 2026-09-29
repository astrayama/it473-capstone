"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Close, Menu } from "@/components/icons";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({ pathname }: { pathname: string }) {
  return (
    <ul className="space-y-1">
      {links.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors ${
                active ? "bg-accent-wash font-medium text-accent-ink" : "text-fg-2 hover:bg-surface-3 hover:text-fg"
              }`}
            >
              {l.label}
              {active && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Staff navigation. Desktop: a list in the sidebar. Phones (`mobile`): a top bar with a drawer. */
export function AdminNavLinks({ mobile = false, brand, footer }: { mobile?: boolean; brand?: ReactNode; footer?: ReactNode }) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mobile) {
    return (
      <nav aria-label="Staff">
        <NavList pathname={pathname} />
      </nav>
    );
  }

  return (
    <div className="sticky top-0 z-40 border-b border-line bg-surface lg:hidden">
      <div className="flex h-16 items-center justify-between px-5">
        {brand}
        <button
          type="button"
          className="btn-ghost -mr-3"
          aria-expanded={open}
          aria-controls="admin-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          {open ? <Close /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav id="admin-menu" aria-label="Staff" className="space-y-6 border-t border-line px-5 py-5">
          <NavList pathname={pathname} />
          {footer}
        </nav>
      )}
    </div>
  );
}
