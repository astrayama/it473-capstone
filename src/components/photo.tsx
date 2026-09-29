import Image from "next/image";
import type { BrandPhoto } from "@/config/photos";

interface Props {
  photo: BrandPhoto;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  /** Above-the-fold photos load eagerly with high priority. */
  eager?: boolean;
  /** Decorative photos (behind text that says the same thing) get empty alt text. */
  decorative?: boolean;
}

/** Brand photograph filling its (positioned) container, cropped with object-cover. */
export function Photo({ photo, className = "", imgClassName = "", sizes = "100vw", eager = false, decorative = false }: Props) {
  // `fill` images need a positioned parent; callers may position it themselves.
  const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className);
  return (
    <div className={`${positioned ? "" : "relative"} overflow-hidden ${className}`}>
      <Image
        src={photo.src}
        alt={decorative ? "" : photo.alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className={`object-cover ${imgClassName}`}
        style={photo.position ? { objectPosition: photo.position } : undefined}
      />
    </div>
  );
}
