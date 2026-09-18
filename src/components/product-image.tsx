import Image from "next/image";

interface Props {
  src: string | null;
  category: string;
  alt: string;
  size?: number;
  className?: string;
}

/** Product photo from Cloud Storage, or the category placeholder when none is set. */
export function ProductImage({ src, category, alt, size = 300, className = "" }: Props) {
  return (
    <Image
      src={src ?? `/placeholders/${category}.svg`}
      alt={alt}
      width={size}
      height={Math.round(size * 0.75)}
      className={`rounded-md object-cover ${className}`}
      style={{ width: size, height: Math.round(size * 0.75) }}
    />
  );
}
