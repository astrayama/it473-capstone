"use client";

/** Production builds minify server errors; show something readable instead. */
function friendly(message: string) {
  return message.includes("Minified React error") || message.includes("Server Components render")
    ? "The server couldn't load the data for this page."
    : message;
}

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card max-w-2xl space-y-4">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display-s">This page couldn&apos;t load.</h1>
      <p className="text-sm text-fg-2">{friendly(error.message)}</p>
      <p className="alert-info text-xs leading-5">
        Staff pages need both Firestore (catalog) and Cloud SQL (stock, orders, customers). Check <code>DATABASE_URL</code>,
        the Cloud SQL instance, and Application Default Credentials.
      </p>
      <button type="button" onClick={reset} className="btn-secondary">Try again</button>
    </div>
  );
}
