import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
  as?: "h1" | "h2";
  size?: "l" | "m" | "s";
  className?: string;
}

/** Eyebrow + display title (+ optional lede and a trailing action), used to open sections. */
export function SectionHeading({ eyebrow, title, lede, action, as: Tag = "h2", size = "m", className = "" }: Props) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-8 gap-y-4 ${className}`}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <Tag className={`display-${size}`}>{title}</Tag>
        {lede && <p className="lede mt-4">{lede}</p>}
      </div>
      {action}
    </div>
  );
}
