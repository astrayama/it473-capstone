import Link from "next/link";

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
    <div className="flex items-center justify-between text-sm text-neutral-600">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        {page > 1 ? <Link href={href(page - 1)} className="btn-secondary btn-sm">Previous</Link> : <span />}
        {page < pages && <Link href={href(page + 1)} className="btn-secondary btn-sm">Next</Link>}
      </div>
    </div>
  );
}
