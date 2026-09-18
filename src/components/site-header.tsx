import Link from "next/link";
import { siteConfig } from "@/config/site";
import type { Session } from "@/lib/auth";
import { CartLink } from "@/components/cart/cart-link";
import { LogoutButton } from "@/components/auth/logout-button";

export function SiteHeader({ session }: { session: Session | null }) {
  return (
    <header className="border-b border-brand-100 bg-white">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-800">
          <span className="inline-block h-7 w-7 rounded-full bg-brand-600" aria-hidden />
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/catalog" className="font-medium hover:text-brand-700">Catalog</Link>
          <CartLink />
          {session ? (
            <>
              {session.customer && (
                <Link href="/account" className="font-medium hover:text-brand-700">
                  {session.customer.businessName}
                </Link>
              )}
              {session.isAdmin && (
                <Link href="/admin" className="badge bg-brand-800 text-white">Admin</Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="font-medium hover:text-brand-700">Sign in</Link>
              <Link href="/register" className="btn-primary btn-sm">Apply for an account</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
