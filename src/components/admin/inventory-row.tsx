"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  productId: string;
  sku: string;
  name: string;
  quantityOnHand: number;
  reorderPoint: number;
  binLocation: string | null;
}

/** One editable row on the inventory page. Saves straight to Cloud SQL. */
export function InventoryRow(props: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(props.quantityOnHand);
  const [reorder, setReorder] = useState(props.reorderPoint);
  const [bin, setBin] = useState(props.binLocation ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dirty = qty !== props.quantityOnHand || reorder !== props.reorderPoint || bin !== (props.binLocation ?? "");
  const low = qty <= reorder;

  async function save() {
    setState("saving");
    const res = await fetch(`/api/admin/inventory/${props.productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantityOnHand: qty, reorderPoint: reorder, binLocation: bin || null }),
    });
    if (res.ok) {
      setState("saved");
      router.refresh();
      setTimeout(() => setState("idle"), 1500);
    } else {
      setState("error");
    }
  }

  return (
    <tr className={low ? "bg-amber-50" : ""}>
      <td className="font-mono text-xs">{props.sku}</td>
      <td className="font-medium">{props.name}</td>
      <td>
        <input type="number" min={0} className="input w-24" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} aria-label="Cases on hand" />
      </td>
      <td>
        <input type="number" min={0} className="input w-24" value={reorder} onChange={(e) => setReorder(Number(e.target.value) || 0)} aria-label="Low-stock alert" />
      </td>
      <td>
        <input className="input w-24" value={bin} onChange={(e) => setBin(e.target.value)} aria-label="Bin" />
      </td>
      <td>
        {low && <span className="badge bg-amber-100 text-amber-800">Low</span>}
      </td>
      <td className="text-right">
        <button type="button" onClick={save} disabled={!dirty || state === "saving"} className="btn-primary btn-sm">
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : state === "error" ? "Retry" : "Save"}
        </button>
      </td>
    </tr>
  );
}
