import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@/components/icons";

interface Props {
  page: number;
  pages: number;
  total: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}

export function Pagination({ page, pages, total, basePath, query = {} }: Props) {
  const href = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => v && params.set(k, v));
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 text-sm">
      <span className="meta numeric">
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="btn-secondary btn-sm" rel="prev">
            <ArrowLeft width={14} height={14} /> Previous
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className="btn-secondary btn-sm" rel="next">
            Next <ArrowRight width={14} height={14} />
          </Link>
        )}
      </div>
    </nav>
  );
}
