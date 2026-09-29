import type { CSSProperties } from "react";

/** Stagger index for `.reveal` / `.rise` animations (see globals.css). */
export function stagger(i: number): CSSProperties {
  return { "--i": i } as CSSProperties;
}

/** View-transition names must be valid CSS identifiers. */
export function transitionName(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/[^A-Za-z0-9_-]/g, "_")}`;
}
