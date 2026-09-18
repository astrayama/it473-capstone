"use client";

/** Production builds minify server errors; show something readable instead. */
function friendly(message: string) {
  return message.includes("Minified React error") || message.includes("Server Components render")
    ? "The server could not load the data for this page."
    : message;
}

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-neutral-700">{friendly(error.message)}</p>
      <div className="alert-info text-xs">
        If you are setting this project up, check that <code>DATABASE_URL</code> points at Cloud SQL (proxy running?),
        that <code>GOOGLE_CLOUD_PROJECT</code> / Firebase settings are set, and that you have run
        <code> gcloud auth application-default login</code>.
      </div>
      <button type="button" onClick={reset} className="btn-secondary">Try again</button>
    </div>
  );
}
