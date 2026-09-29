import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { AuthSplit } from "@/components/auth/auth-split";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/catalog";
  if (await getSession()) redirect(next);

  return (
    <PageTransition>
      <AuthSplit eyebrow="Trade accounts" title={<>Welcome <em className="text-accent-ink">back.</em></>} intro="For wholesale customers and staff.">
        <LoginForm next={next} />
        <p className="mt-8 text-sm text-fg-2">
          New to Prairie Crest? <Link href="/register" className="link text-fg">Apply for a wholesale account</Link>.
        </p>
      </AuthSplit>
    </PageTransition>
  );
}
