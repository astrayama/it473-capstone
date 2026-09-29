"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  productId: string;
  sku: string;
  name: string;
  /** false = the product has no stock row yet ("not tracked"). */
  tracked: boolean;
  /** Rows whose product is gone from the catalog can't be edited. */
  readOnly?: boolean;
  quantityOnHand: number;
  reorderPoint: number;
  binLocation: string | null;
}

/** One editable row on the inventory page. Saves straight to Cloud SQL (creating the row if needed). */
export function InventoryRow(props: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(props.quantityOnHand);
  const [reorder, setReorder] = useState(props.reorderPoint);
  const [bin, setBin] = useState(props.binLocation ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dirty =
    !props.tracked || qty !== props.quantityOnHand || reorder !== props.reorderPoint || bin !== (props.binLocation ?? "");
  const low = props.tracked && qty <= reorder;

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
    <tr className={low ? "bg-warning-wash" : ""}>
      <td className="numeric text-xs tracking-[0.06em] text-fg-2">{props.sku}</td>
      <td className="font-medium">{props.name}</td>
      <td>
        <input type="number" min={0} className="input numeric w-24" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} aria-label="On hand" />
      </td>
      <td>
        <input type="number" min={0} className="input numeric w-24" value={reorder} onChange={(e) => setReorder(Number(e.target.value) || 0)} aria-label="Low-stock alert" />
      </td>
      <td>
        <input className="input numeric w-24" value={bin} onChange={(e) => setBin(e.target.value)} aria-label="Bin" />
      </td>
      <td>
        {!props.tracked && <span className="badge badge-neutral">Not tracked</span>}
        {low && <span className="badge badge-dot badge-warning">Low</span>}
      </td>
      <td className="text-right">
        <button type="button" onClick={save} disabled={props.readOnly || !dirty || state === "saving"} className="btn-primary btn-sm">
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "error" ? "Retry" : props.tracked ? "Save" : "Start tracking"}
        </button>
      </td>
    </tr>
  );
}
