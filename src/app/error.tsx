"use client";

/** Last-resort error boundary (errors in layouts). Deliberately self-contained. */
export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page py-24">
      <div className="card mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm">This page couldn&apos;t be displayed. Please try again in a moment.</p>
        <button type="button" onClick={reset} className="btn-secondary">Try again</button>
      </div>
    </div>
  );
}
