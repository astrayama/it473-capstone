import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Staff admin</h1>
        <span className="text-sm text-neutral-500">Signed in as {session.email}</span>
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
