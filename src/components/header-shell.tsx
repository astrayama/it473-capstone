"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { Wordmark } from "@/components/brand/wordmark";
import { CartLink } from "@/components/cart/cart-link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Close, Menu } from "@/components/icons";

export interface HeaderAccount {
  businessName: string | null;
  isAdmin: boolean;
  email: string;
}

/**
 * Fixed storefront header. Transparent over the home hero until the page scrolls, then
 * glass. On small screens the links move into a full-screen menu that closes on
 * navigation, Escape, or the close button.
 */
export function HeaderShell({ account }: { account: HeaderAccount | null }) {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    firstLinkRef.current?.focus();
    const toggle = toggleRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [open]);

  const solid = scrolled || !overHero || open;
  const navLink = "text-sm text-fg-2 transition-colors hover:text-fg";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          solid ? "glass border-b border-line" : "border-b border-transparent"
        }`}
        style={{ viewTransitionName: "site-header" }}
      >
        <div className="container-page flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link href="/" aria-label={`${siteConfig.name}, home`} className="shrink-0">
            <Wordmark compact />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
            <Link href="/catalog" className={navLink} aria-current={pathname.startsWith("/catalog") ? "page" : undefined}>
              Catalog
            </Link>
            {account?.businessName && (
              <Link href="/account" className={navLink} aria-current={pathname.startsWith("/account") ? "page" : undefined}>
                {account.businessName}
              </Link>
            )}
            {account?.isAdmin && (
              <Link href="/admin" className={navLink}>Staff admin</Link>
            )}
            {account ? <LogoutButton className={navLink} /> : <Link href="/login" className={navLink}>Sign in</Link>}
            <CartLink />
            {!account && (
              <Link href="/register" className="btn-primary btn-sm">Apply for an account</Link>
            )}
          </nav>

          <div className="flex items-center gap-4 md:hidden">
            <CartLink />
            <button
              ref={toggleRef}
              type="button"
              className="btn-ghost -mr-3"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpenOn(open ? null : pathname)}
            >
              {open ? <Close /> : <Menu />}
            </button>
          </div>
        </div>

      </header>
      {/* A sibling of <header>: its backdrop-filter would otherwise trap this fixed panel. */}
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-[var(--header-h)] bottom-0 z-40 overflow-y-auto bg-bg md:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col gap-2 py-10">
            <Link ref={firstLinkRef} href="/catalog" className="display-s py-2">The catalog</Link>
            {account?.businessName && <Link href="/account" className="display-s py-2">Your account</Link>}
            {account?.isAdmin && <Link href="/admin" className="display-s py-2">Staff admin</Link>}
            <Link href="/cart" className="display-s py-2">Your order</Link>
            {account ? (
              <LogoutButton className="display-s py-2 text-left text-fg-2" />
            ) : (
              <>
                <Link href="/login" className="display-s py-2">Sign in</Link>
                <Link href="/register" className="btn-primary mt-8 self-start">Apply for an account</Link>
              </>
            )}
            <div className="rule mt-10 pt-6 text-sm text-fg-2">
              <p>{siteConfig.supportPhone}</p>
              <p>{siteConfig.supportEmail}</p>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
