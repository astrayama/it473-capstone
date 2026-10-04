import { siteConfig } from "@/config/site";
import { CrestMark } from "@/components/brand/crest";

/**
 * Horizontal lockup: crest mark + "Prairie Crest" in the display italic + tracked "Foods".
 * Live text (not outlines) so it stays crisp and readable by assistive tech.
 */
export function Wordmark({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <CrestMark className={compact ? "size-8 text-accent-ink" : "size-10 text-accent-ink"} />
      <span className="flex flex-col leading-none">
        <span className={`font-display italic tracking-[-0.01em] ${compact ? "text-[1.35rem]" : "text-[1.6rem]"}`}>
          {siteConfig.shortName}
        </span>
        <span className="mt-1 text-[0.625rem] font-medium uppercase tracking-[0.42em] text-fg-2">Foods</span>
      </span>
    </span>
  );
}
