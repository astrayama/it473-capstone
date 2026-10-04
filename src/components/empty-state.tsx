import type { ReactNode } from "react";
import { CrestMark } from "@/components/brand/crest";

/** Quiet, centered placeholder for empty lists and missing things. */
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-md border border-dashed border-line-strong px-6 py-16 text-center">
      <CrestMark className="mb-6 size-12 text-accent-ink opacity-60" />
      <h2 className="display-s">{title}</h2>
      {children && <div className="lede mt-3 max-w-md text-base">{children}</div>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
