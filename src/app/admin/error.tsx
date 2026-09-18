"use client";

/** Production builds minify server errors; show something readable instead. */
function friendly(message: string) {
  return message.includes("Minified React error") || message.includes("Server Components render")
    ? "The server could not load the data for this page."
    : message;
}

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">Could not load this admin page</h2>
      <p className="text-sm text-neutral-700">{friendly(error.message)}</p>
      <p className="text-xs text-neutral-500">
        Admin pages need both Firestore (catalog) and Cloud SQL (stock, orders, customers). Check DATABASE_URL, the Cloud SQL proxy, and Application Default Credentials.
      </p>
      <button type="button" onClick={reset} className="btn-secondary">Try again</button>
    </div>
  );
}
