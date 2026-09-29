import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { StoreChrome } from "@/components/store-chrome";
import { CrestMark } from "@/components/brand/crest";

export const metadata: Metadata = { title: "Not found" };

/**
 * Unmatched URLs and notFound() from storefront pages land here, outside the (store)
 * layout, so this page brings its own chrome.
 */
export default async function NotFound() {
  const session = await getSession();
  return (
    <StoreChrome session={session}>
      <div className="container-page flex min-h-[70dvh] flex-col items-center justify-center py-24 text-center">
        <CrestMark className="size-16 text-accent-ink opacity-70" />
        <p className="eyebrow mt-8">Error 404</p>
        <h1 className="display-l mt-4">This shelf is <em className="text-accent-ink">empty.</em></h1>
        <p className="lede mt-6 max-w-md">The page you were after isn&apos;t here, or it has moved.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/catalog" className="btn-primary">Enter the catalog</Link>
          <Link href="/" className="btn-secondary">Back to home</Link>
        </div>
      </div>
    </StoreChrome>
  );
}
