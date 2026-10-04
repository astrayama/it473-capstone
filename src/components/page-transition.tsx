import { ViewTransition, type ReactNode } from "react";

/**
 * Page enter/exit animation for storefront routes (see ::view-transition rules in
 * globals.css). Lives in each page, not the layout: layouts persist across
 * navigations, so enter and exit would never fire there.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
