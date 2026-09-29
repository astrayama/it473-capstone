import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthSplit } from "@/components/auth/auth-split";

export const metadata: Metadata = { title: "Apply for an account" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session?.customer) redirect("/account");

  return (
    <AuthSplit
      wide
      eyebrow="Apply"
      title={<>Open a <em className="text-accent-ink">trade account.</em></>}
      intro={
        <>
          For restaurants, grocers, schools and institutions. Already have an account?{" "}
          <Link href="/login" className="link text-fg">Sign in</Link>.
        </>
      }
    >
      <RegisterForm />
    </AuthSplit>
  );
}
