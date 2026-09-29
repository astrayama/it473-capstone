import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import { searchProducts } from "@/lib/catalog";
import { categoryLabel, listCategories } from "@/lib/categories";
import { tryGetInventoryMap } from "@/lib/inventory";
import { canOrder, canSeePrices, getSession } from "@/lib/auth";
import { stagger } from "@/lib/motion";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { EmptyState } from "@/components/empty-state";
import { Search } from "@/components/icons";

export const metadata: Metadata = { title: "Catalog" };

export default async function CatalogPage(props: PageProps<"/catalog">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const category = typeof sp.category === "string" ? sp.category : "";

  const [session, products, categories] = await Promise.all([
    getSession(),
    searchProducts({ q, category }),
    listCategories(),
  ]);
  const inventory = await tryGetInventoryMap(products.map((p) => p.id));
  const showPrice = canSeePrices(session);
  const ordering = canOrder(session);
  const current = category ? categories.find((c) => c.id === category) : undefined;

  const chipHref = (id: string) => {
    const params = new URLSearchParams();
    if (id) params.set("category", id);
    if (q) params.set("q", q);
    const s = params.toString();
    return s ? `/catalog?${s}` : "/catalog";
  };
  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors ${
      active ? "border-accent bg-accent text-on-accent" : "border-line-strong text-fg-2 hover:border-accent-ink hover:text-fg"
    }`;

  return (
    <div className="container-page py-16 md:py-20">
      <SectionHeading
        as="h1"
        size="l"
        eyebrow={current ? "The catalog" : "Wholesale provisions"}
        title={current ? current.name : <>The <em className="text-accent-ink">catalog</em></>}
        lede={current?.description || "Everything we carry, sold to the trade by the case, pack or bag."}
      />

      <div className="glass sticky top-[calc(var(--header-h)+0.75rem)] z-30 mt-12 flex flex-col gap-3 rounded-lg border border-line p-3 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Categories" className="-mx-1 flex gap-2 overflow-x-auto px-1">
          <Link href={chipHref("")} className={chip(!category)} aria-current={!category ? "page" : undefined}>All</Link>
          {categories.map((c) => (
            <Link key={c.id} href={chipHref(c.id)} className={chip(category === c.id)} aria-current={category === c.id ? "page" : undefined}>
              {c.name}
            </Link>
          ))}
        </nav>
        <Form action="/catalog" className="relative md:w-80" role="search">
          {category && <input type="hidden" name="category" value={category} />}
          <Search className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-fg-3" width={16} height={16} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or SKU"
            aria-label="Search the catalog"
            className="input rounded-full border-line py-2 pl-10"
          />
        </Form>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="meta numeric" aria-live="polite">
          {products.length} {products.length === 1 ? "provision" : "provisions"}
          {q && <> matching “{q}”</>}
        </p>
        {!showPrice && (
          <p className="text-sm text-fg-2">
            Trade pricing is shown to approved accounts. <Link href="/login?next=/catalog" className="link text-fg">Sign in</Link> or{" "}
            <Link href="/register" className="link text-fg">apply</Link>.
          </p>
        )}
      </div>
      {session && !ordering && session.customer?.status === "PENDING" && (
        <p className="alert-info mt-6">Your account is pending approval. You can order as soon as our team approves it.</p>
      )}

      {products.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Nothing matches, yet."
            action={<Link href="/catalog" className="btn-secondary">See the whole catalog</Link>}
          >
            Try a different search or category.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-10 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <div key={p.id} className="reveal" style={stagger(i % 3)}>
              <ProductCard
                product={p}
                categoryLabel={categoryLabel(categories, p.category)}
                inventory={inventory}
                showPrice={showPrice}
                canOrder={ordering}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
