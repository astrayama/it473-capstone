import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link href="/" className="btn-primary mt-4">Back to home</Link>
    </div>
  );
}
