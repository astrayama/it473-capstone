import type { StockLevel } from "@/lib/inventory";

const styles: Record<StockLevel, { label: string; cls: string }> = {
  in_stock: { label: "In stock", cls: "badge-success" },
  low: { label: "Low stock", cls: "badge-warning" },
  out: { label: "Out of stock", cls: "badge-neutral" },
};

/** Stock pill. Renders nothing when stock is unknown (stock database unavailable). */
export function StockBadge({ level }: { level: StockLevel | null }) {
  if (!level) return null;
  const s = styles[level];
  return <span className={`badge badge-dot ${s.cls}`}>{s.label}</span>;
}
