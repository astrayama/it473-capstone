"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { orderStatusLabels } from "@/lib/format";

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: string) {
    setValue(next);
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) setError((await res.json()).error ?? "Update failed.");
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <select className="input max-w-xs" value={value} disabled={busy} onChange={(e) => onChange(e.target.value)}>
        {Object.entries(orderStatusLabels).map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
      {error && <p className="alert-error mt-2">{error}</p>}
      <p className="mt-1 text-xs text-neutral-500">Marking an order Paid deducts its cases from inventory.</p>
    </div>
  );
}
