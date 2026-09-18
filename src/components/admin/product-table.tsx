"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCents } from "@/lib/format";
import { categoryName } from "@/config/categories";

export interface ProductRow {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  packSize: string;
  casePriceCents: number;
  active: boolean;
  quantityOnHand: number | null;
  reorderPoint: number | null;
}

export function ProductTable({ rows }: { rows: ProductRow[] }) {
  const [q, setQ] = useState("");
  const filtered = q
    ? rows.filter((r) => [r.name, r.sku, r.brand, categoryName(r.category)].some((f) => f.toLowerCase().includes(q.toLowerCase())))
    : rows;

  return (
    <div className="card p-0">
      <div className="flex items-center gap-3 p-4">
        <input className="input max-w-sm" placeholder="Search by name, SKU, brand, category…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="text-sm text-neutral-500">{filtered.length} of {rows.length}</span>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th>Category</th>
            <th>Pack</th>
            <th>Case price</th>
            <th>On hand</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => {
            const low = r.quantityOnHand !== null && r.reorderPoint !== null && r.quantityOnHand <= r.reorderPoint;
            return (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.sku}</td>
                <td>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-neutral-500">{r.brand}</div>
                </td>
                <td>{categoryName(r.category)}</td>
                <td>{r.packSize}</td>
                <td>{formatCents(r.casePriceCents)}</td>
                <td className={low ? "font-semibold text-amber-700" : ""}>{r.quantityOnHand ?? "—"}</td>
                <td>
                  <span className={`badge ${r.active ? "bg-brand-100 text-brand-800" : "bg-neutral-200 text-neutral-700"}`}>
                    {r.active ? "Visible" : "Hidden"}
                  </span>
                </td>
                <td className="text-right">
                  <Link href={`/admin/products/${r.id}`} className="btn-secondary btn-sm">Edit</Link>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-neutral-500">No products match.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
