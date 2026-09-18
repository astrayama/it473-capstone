import { orderStatusLabels } from "@/lib/format";

const colors: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-800",
  PAID: "bg-brand-100 text-brand-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-neutral-200 text-neutral-700",
  CANCELLED: "bg-red-100 text-red-800",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return <span className={`badge ${colors[status] ?? "bg-neutral-200"}`}>{orderStatusLabels[status] ?? status}</span>;
}
