import { CREST_SVG, CREST_VIEWBOX, MARK_SVG } from "@/components/brand/brand-svg";

interface Props {
  className?: string;
  /** Accessible name. Omit when the mark sits next to visible brand text. */
  label?: string;
}

// The SVG bodies are generated from the brand fonts (see brand-svg.ts) and drawn in
// currentColor, so the crest takes the surrounding text colour (gold on noir, ink on daylight).

/** Full crest: rings, lettering, monogram, wheat and a rising sun. Use at 96px and up. */
export function Crest({ className, label }: Props) {
  return (
    <svg
      viewBox={CREST_VIEWBOX}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: CREST_SVG }}
    />
  );
}

/** Simplified mark (ring, monogram, horizon) for small sizes: headers, favicons, seals. */
export function CrestMark({ className, label }: Props) {
  return (
    <svg
      viewBox={CREST_VIEWBOX}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: MARK_SVG }}
    />
  );
}
