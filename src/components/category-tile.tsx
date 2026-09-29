import Link from "next/link";
import type { Category } from "@/lib/categories";
import { categoryCover } from "@/config/photos";
import { Photo } from "@/components/photo";
import { ArrowRight } from "@/components/icons";

/** Tall photographic tile for a Firestore category, linking to the filtered catalog. */
export function CategoryTile({ category, index }: { category: Category; index: number }) {
  const cover = categoryCover(category.id);
  return (
    <Link
      href={`/catalog?category=${encodeURIComponent(category.id)}`}
      className="tile group relative flex aspect-[3/4] min-h-[26rem] flex-col justify-end overflow-hidden rounded-lg bg-surface-2 sm:aspect-[4/5]"
    >
      <Photo photo={cover} decorative sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 90vw" className="absolute inset-0" imgClassName="tile-img" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgb(14_12_10/0.95)_0%,rgb(14_12_10/0.55)_40%,rgb(14_12_10/0.05)_75%)]" />
      <div className="relative p-7">
        <p className="eyebrow numeric mb-3">No. {String(index + 1).padStart(2, "0")}</p>
        <h3 className="display-s italic">{category.name}</h3>
        {category.description && <p className="mt-2 max-w-xs text-sm text-fg-2">{category.description}</p>}
        <span className="mt-6 inline-flex items-center gap-2 text-sm text-accent-ink">
          Explore <ArrowRight width={16} height={16} className="transition-transform duration-500 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
