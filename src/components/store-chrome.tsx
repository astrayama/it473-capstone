import type { ReactNode } from "react";
import type { Session } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Storefront frame (noir theme, header, full-width main, footer). Shared by the (store)
 * layout and the root not-found page, which renders outside that layout.
 */
export function StoreChrome({ session, children }: { session: Session | null; children: ReactNode }) {
  return (
    <div data-theme="noir" className="flex min-h-dvh flex-col bg-bg text-fg">
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader session={session} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
