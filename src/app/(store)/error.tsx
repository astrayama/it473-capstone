"use client";

/** Production builds minify server errors; show something readable instead. */
function friendly(message: string) {
  return message.includes("Minified React error") || message.includes("Server Components render")
    ? "The server could not load the data for this page."
    : message;
}

/** Errors inside storefront pages render within the store header and footer. */
export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page py-16">
      <div className="card mx-auto max-w-xl space-y-4">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm">{friendly(error.message)}</p>
        <div className="alert-info text-xs">
          If you are setting this project up, check that <code>GOOGLE_CLOUD_PROJECT</code> is set and that you have run
          <code> gcloud auth application-default login --disable-quota-project</code>. Stock and orders also need
          <code> DATABASE_URL</code> (Cloud SQL).
        </div>
        <button type="button" onClick={reset} className="btn-secondary">Try again</button>
      </div>
    </div>
  );
}
