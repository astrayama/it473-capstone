import { formatCents, perUnit } from "@/lib/format";

interface Props {
  cents: number;
  unit: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = { sm: "text-base", md: "text-xl", lg: "text-4xl" };

/** Tabular price with its unit ("$34.99 per case"). Zero means the price is missing. */
export function Price({ cents, unit, size = "md", className = "" }: Props) {
  if (cents <= 0) return <span className={`meta ${className}`}>Price on request</span>;
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className={`price ${sizes[size]}`}>{formatCents(cents)}</span>
      <span className="meta">{perUnit(unit)}</span>
    </span>
  );
}
