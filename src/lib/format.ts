export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export const orderStatusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const customerStatusLabels: Record<string, string> = {
  PENDING: "Pending approval",
  APPROVED: "Approved",
  SUSPENDED: "Suspended",
};

export function orderNumber(n: number): string {
  return `#${String(n).padStart(5, "0")}`;
}

/** "dry-goods" -> "Dry Goods". */
export function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** "case" -> "per case". */
export function perUnit(unit: string | null | undefined): string {
  return `per ${unit?.trim() || "case"}`;
}
