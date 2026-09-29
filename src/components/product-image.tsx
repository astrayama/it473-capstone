import Image from "next/image";
import { PRODUCT_FALLBACK } from "@/lib/media";

type Aspect = "4/5" | "4/3" | "1/1";

interface Props {
  src: string | null;
  alt: string;
  aspect?: Aspect;
  /** Load immediately (above-the-fold hero images). */
  eager?: boolean;
  sizes?: string;
  className?: string;
}

/** Product photo from the media bucket (via /media), or the brand fallback when none is set. */
export function ProductImage({ src, alt, aspect = "4/3", eager = false, sizes = "(min-width: 1024px) 33vw, 100vw", className = "" }: Props) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-neutral-100 ${className}`} style={{ aspectRatio: aspect.replace("/", " / ") }}>
      <Image
        src={src ?? PRODUCT_FALLBACK}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className="object-cover"
      />
    </div>
  );
}
