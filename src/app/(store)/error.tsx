"use client";

import { CrestMark } from "@/components/brand/crest";

/** Production builds minify server errors; show something readable instead. */
function friendly(message: string) {
  return message.includes("Minified React error") || message.includes("Server Components render")
    ? "The server couldn't load the data for this page."
    : message;
}

/** Errors inside storefront pages render within the store header and footer. */
export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex min-h-[70dvh] flex-col items-center justify-center py-24 text-center">
      <CrestMark className="size-16 text-accent-ink opacity-70" />
      <p className="eyebrow mt-8">Something went wrong</p>
      <h1 className="display-m mt-4">We couldn&apos;t set the table.</h1>
      <p className="lede mt-6 max-w-lg">{friendly(error.message)}</p>
      <div className="alert-info mt-8 max-w-lg text-left text-xs leading-5">
        Setting this project up? Check that <code>GOOGLE_CLOUD_PROJECT</code> is set and that you have run
        <code> gcloud auth application-default login --disable-quota-project</code>. Stock and orders also need
        <code> DATABASE_URL</code> (Cloud SQL).
      </div>
      <button type="button" onClick={reset} className="btn-secondary mt-8">Try again</button>
    </div>
  );
}
