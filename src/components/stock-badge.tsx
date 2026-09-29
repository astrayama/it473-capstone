import type { StockLevel } from "@/lib/inventory";

const styles: Record<StockLevel, { label: string; cls: string }> = {
  in_stock: { label: "In stock", cls: "bg-brand-100 text-brand-800" },
  low: { label: "Low stock", cls: "bg-amber-100 text-amber-800" },
  out: { label: "Out of stock", cls: "bg-neutral-200 text-neutral-700" },
};

/** Stock pill. Renders nothing when stock is unknown (stock database unavailable). */
export function StockBadge({ level }: { level: StockLevel | null }) {
  if (!level) return null;
  const s = styles[level];
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}
