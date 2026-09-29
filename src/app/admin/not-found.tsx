import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">Not found</h2>
      <p className="text-sm">That record doesn&apos;t exist, or it was removed.</p>
      <Link href="/admin" className="btn-secondary btn-sm">Back to the dashboard</Link>
    </div>
  );
}
