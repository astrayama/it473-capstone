import type { ReactNode } from "react";

/** Title row for staff pages: eyebrow, display title, optional description and actions. */
export function AdminPageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="display-s">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-fg-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
