"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useFirebaseConfig } from "@/components/providers/firebase-provider";
import { friendlyAuthError, getFirebaseAuth } from "@/lib/firebase/client";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const config = useFirebaseConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!config) {
    return (
      <div className="alert-warning" role="status">
        <p className="font-medium">Sign-in isn&apos;t available yet.</p>
        <p className="mt-1 text-fg-2">
          This environment has no Firebase web app configured (FIREBASE_API_KEY and FIREBASE_APP_ID).
        </p>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const auth = getFirebaseAuth(config!);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not start a session.");
      router.push(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" className="input" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" type="password" className="input" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="alert-error" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary btn-lg w-full">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
