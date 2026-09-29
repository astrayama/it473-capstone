import { customerStatusLabels, orderStatusLabels } from "@/lib/format";

const orderTone: Record<string, string> = {
  PENDING_PAYMENT: "badge-warning",
  PAID: "badge-accent",
  CONFIRMED: "badge-info",
  OUT_FOR_DELIVERY: "badge-info",
  DELIVERED: "badge-success",
  CANCELLED: "badge-danger",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-dot ${orderTone[status] ?? "badge-neutral"}`}>{orderStatusLabels[status] ?? status}</span>;
}

const customerTone: Record<string, string> = {
  PENDING: "badge-warning",
  APPROVED: "badge-success",
  SUSPENDED: "badge-danger",
};

export function CustomerStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-dot ${customerTone[status] ?? "badge-neutral"}`}>{customerStatusLabels[status] ?? status}</span>
  );
}
