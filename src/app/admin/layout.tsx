import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

/** Staff area: light "daylight" theme with its own sidebar, outside the storefront chrome. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  return (
    <div data-theme="daylight" className="min-h-dvh bg-bg text-fg">
      <a href="#main" className="skip-link">Skip to content</a>
      <AdminShell email={session.email}>{children}</AdminShell>
    </div>
  );
}
