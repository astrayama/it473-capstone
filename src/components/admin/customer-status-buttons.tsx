"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CustomerStatusButtons({ customerId, status }: { customerId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: "APPROVED" | "SUSPENDED" | "PENDING") {
    setBusy(true);
    await fetch(`/api/admin/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-2">
      {status !== "APPROVED" && (
        <button type="button" disabled={busy} onClick={() => setStatus("APPROVED")} className="btn-primary btn-sm">Approve</button>
      )}
      {status === "APPROVED" && (
        <button type="button" disabled={busy} onClick={() => setStatus("SUSPENDED")} className="btn-danger btn-sm">Suspend</button>
      )}
      {status === "SUSPENDED" && (
        <button type="button" disabled={busy} onClick={() => setStatus("PENDING")} className="btn-secondary btn-sm">Reset to pending</button>
      )}
    </div>
  );
}
