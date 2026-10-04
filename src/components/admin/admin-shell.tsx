import type { ReactNode } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { CrestMark } from "@/components/brand/crest";
import { LogoutButton } from "@/components/auth/logout-button";
import { AdminNavLinks } from "@/components/admin/admin-nav-links";

/** Staff area frame (daylight theme): sidebar on desktop, top bar + drawer on phones. */
export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const brand = (
    <Link href="/admin" className="flex items-center gap-3">
      <CrestMark className="size-9 text-accent-ink" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl italic">{siteConfig.shortName}</span>
        <span className="mt-1 text-[0.625rem] font-medium tracking-[0.3em] text-fg-3 uppercase">Staff</span>
      </span>
    </Link>
  );
  const footer = (
    <div className="space-y-3 border-t border-line pt-5 text-sm">
      <p className="truncate text-fg-3" title={email}>{email}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href="/" className="link text-fg-2">View storefront</Link>
        <LogoutButton className="link text-fg-2" />
      </div>
    </div>
  );

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col justify-between border-r border-line bg-surface px-5 py-7 lg:flex">
        <div className="space-y-10">
          {brand}
          <AdminNavLinks />
        </div>
        {footer}
      </aside>
      <AdminNavLinks mobile brand={brand} footer={footer} />
      <main id="main" className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
