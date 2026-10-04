import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="card max-w-2xl space-y-4">
      <p className="eyebrow">Not found</p>
      <h1 className="display-s">That record isn&apos;t here.</h1>
      <p className="text-sm text-fg-2">It doesn&apos;t exist, or it was removed.</p>
      <Link href="/admin" className="btn-secondary btn-sm">Back to the dashboard</Link>
    </div>
  );
}
