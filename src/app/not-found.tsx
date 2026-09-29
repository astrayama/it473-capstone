import Link from "next/link";
import { getSession } from "@/lib/auth";
import { StoreChrome } from "@/components/store-chrome";

/**
 * Unmatched URLs and notFound() from storefront pages land here, outside the (store)
 * layout, so this page brings its own chrome.
 */
export default async function NotFound() {
  const session = await getSession();
  return (
    <StoreChrome session={session}>
      <div className="container-page py-16">
        <div className="card mx-auto max-w-md text-center">
          <h1 className="text-xl font-semibold">Page not found</h1>
          <Link href="/" className="btn-primary mt-4">Back to home</Link>
        </div>
      </div>
    </StoreChrome>
  );
}
