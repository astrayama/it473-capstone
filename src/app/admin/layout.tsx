import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";

/** Staff area: light "daylight" theme, outside the storefront chrome. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  return (
    <div data-theme="daylight" className="min-h-dvh bg-bg text-fg">
      <div className="container-page space-y-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Staff admin</h1>
          <span className="text-sm">Signed in as {session.email}</span>
        </div>
        <AdminNav />
        {children}
      </div>
    </div>
  );
}
