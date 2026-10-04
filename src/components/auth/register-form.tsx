"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useFirebaseConfig } from "@/components/providers/firebase-provider";
import { friendlyAuthError, getFirebaseAuth } from "@/lib/firebase/client";

const fields = [
  ["businessName", "Business name", "text"],
  ["contactName", "Contact name", "text"],
  ["phone", "Phone", "tel"],
  ["addressLine1", "Delivery address", "text"],
  ["addressLine2", "Address line 2 (optional)", "text"],
  ["city", "City", "text"],
  ["state", "State (2 letters)", "text"],
  ["postalCode", "ZIP code", "text"],
] as const;

export function RegisterForm() {
  const router = useRouter();
  const config = useFirebaseConfig();
  const [values, setValues] = useState<Record<string, string>>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!config) {
    return (
      <div className="alert-warning" role="status">
        <p className="font-medium">Applications aren&apos;t open on this environment yet.</p>
        <p className="mt-1 text-fg-2">It has no Firebase web app configured (FIREBASE_API_KEY and FIREBASE_APP_ID).</p>
      </div>
    );
  }

  const set = (k: string) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const auth = getFirebaseAuth(config!);
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(auth, values.email, values.password);
      } catch (err) {
        // Allow finishing a registration whose profile step failed earlier.
        if ((err as { code?: string }).code !== "auth/email-already-in-use") throw err;
        cred = await signInWithEmailAndPassword(auth, values.email, values.password);
      }
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, idToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.issues?.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join(", ");
        throw new Error(detail || data.error || "Registration failed.");
      }
      router.push("/account?welcome=1");
      router.refresh();
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email">Work email</label>
          <input id="email" type="email" className="input" required autoComplete="email" value={values.email} onChange={set("email")} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" required minLength={6} autoComplete="new-password" value={values.password} onChange={set("password")} />
        </div>
        {fields.map(([key, label, type]) => (
          <div key={key} className={key === "addressLine1" || key === "businessName" ? "sm:col-span-2" : ""}>
            <label className="label" htmlFor={key}>{label}</label>
            <input
              id={key}
              type={type}
              className="input"
              required={key !== "addressLine2" && key !== "phone"}
              maxLength={key === "state" ? 2 : undefined}
              value={values[key] ?? ""}
              onChange={set(key)}
            />
          </div>
        ))}
      </div>
      {error && <p className="alert-error" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary btn-lg w-full">
        {busy ? "Submitting…" : "Submit application"}
      </button>
      <p className="meta">
        Our team reviews new wholesale accounts within one business day. You can browse the catalog right away and order once approved.
      </p>
    </form>
  );
}
