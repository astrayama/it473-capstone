"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }
  return (
    <button type="button" onClick={signOut} disabled={busy} className="text-sm text-neutral-600 hover:text-brand-700">
      Sign out
    </button>
  );
}
