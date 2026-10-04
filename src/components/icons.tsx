import type { SVGProps } from "react";

/** Minimal 1.5px line icons drawn in currentColor. Decorative unless given aria-label. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 12h15M13 6l6 6-6 6" /></Icon>
);
export const ArrowLeft = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M20 12H5M11 6l-6 6 6 6" /></Icon>
);
export const Crate = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M3.5 8.5h17l-1.5 11h-14zM3.5 8.5 7 4h10l3.5 4.5M9.5 12.5h5" /></Icon>
);
export const Menu = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M4 8h16M4 16h16" /></Icon>
);
export const Close = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>
);
export const Search = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Icon>
);
export const Check = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>
);
export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);
export const Minus = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}><path d="M5 12h14" /></Icon>
);
