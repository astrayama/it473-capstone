import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Apply for an account" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session?.customer) redirect("/account");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Apply for a wholesale account</h1>
        <p className="text-sm text-neutral-600">
          For restaurants, grocers, schools, and institutions. Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-700 underline">Sign in</Link>.
        </p>
      </div>
      <div className="card">
        <RegisterForm />
      </div>
    </div>
  );
}
