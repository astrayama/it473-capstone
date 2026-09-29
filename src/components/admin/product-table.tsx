"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCents, perUnit } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { Search } from "@/components/icons";

export interface ProductRow {
  id: string;
  sku: string;
  name: string;
  categoryLabel: string;
  unitOfMeasure: string;
  priceCents: number;
  active: boolean;
  imageUrl: string | null;
  /** null = no stock row yet, or the stock database is unavailable. */
  quantityOnHand: number | null;
  reorderPoint: number | null;
}

export function ProductTable({ rows }: { rows: ProductRow[] }) {
  const [q, setQ] = useState("");
  const filtered = q
    ? rows.filter((r) => [r.name, r.sku, r.categoryLabel].some((f) => f.toLowerCase().includes(q.toLowerCase())))
    : rows;

  return (
    <div className="card p-0">
      <div className="flex flex-wrap items-center gap-4 p-5">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-fg-3" width={16} height={16} />
          <input className="input pl-10" placeholder="Search by name, SKU, category" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="meta numeric">{filtered.length} of {rows.length}</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>On hand</th>
              <th>Status</th>
              <th><span className="sr-only">Edit</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const low = r.quantityOnHand !== null && r.reorderPoint !== null && r.quantityOnHand <= r.reorderPoint;
              return (
                <tr key={r.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <ProductImage src={r.imageUrl} alt="" aspect="1/1" sizes="40px" className="w-10 shrink-0 rounded-xs" />
                      <span className="font-medium">{r.name}</span>
                    </div>
                  </td>
                  <td className="numeric text-xs tracking-[0.06em] text-fg-2">{r.sku}</td>
                  <td>{r.categoryLabel}</td>
                  <td className="whitespace-nowrap">
                    {r.priceCents > 0 ? formatCents(r.priceCents) : "—"} <span className="meta">{perUnit(r.unitOfMeasure)}</span>
                  </td>
                  <td>
                    {r.quantityOnHand === null ? (
                      <span className="meta">—</span>
                    ) : low ? (
                      <span className="badge badge-dot badge-warning numeric">{r.quantityOnHand} · low</span>
                    ) : (
                      <span className="numeric">{r.quantityOnHand}</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-dot ${r.active ? "badge-success" : "badge-neutral"}`}>{r.active ? "Visible" : "Archived"}</span>
                  </td>
                  <td className="text-right">
                    <Link href={`/admin/products/${encodeURIComponent(r.id)}`} className="btn-secondary btn-sm">Edit</Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="meta py-10 text-center">No products match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
