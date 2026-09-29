import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/catalog";
  if (await getSession()) redirect(next);

  return (
    <div className="container-page max-w-md space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="text-sm text-neutral-600">Wholesale customers and staff.</p>
      </div>
      <div className="card">
        <LoginForm next={next} />
      </div>
      <p className="text-center text-sm text-neutral-600">
        New customer? <Link href="/register" className="font-medium text-brand-700 underline">Apply for a wholesale account</Link>
      </p>
    </div>
  );
}
