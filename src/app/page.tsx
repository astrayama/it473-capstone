import Link from "next/link";
import { siteConfig } from "@/config/site";
import { categories } from "@/config/categories";
import { ProductImage } from "@/components/product-image";

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <p className="badge bg-brand-100 text-brand-800">Wholesale · Midwest delivery</p>
          <h1 className="text-4xl font-bold leading-tight text-brand-800">
            Restaurant-grade food, delivered by the case.
          </h1>
          <p className="text-lg text-neutral-700">{siteConfig.tagline}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/catalog" className="btn-primary">Browse the catalog</Link>
            <Link href="/register" className="btn-secondary">Apply for a wholesale account</Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {categories.slice(0, 6).map((c) => (
            <Link key={c.id} href={`/catalog?category=${c.id}`} className="block">
              <ProductImage src={null} category={c.id} alt={c.name} size={160} className="w-full" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Shop by category</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link key={c.id} href={`/catalog?category=${c.id}`} className="card transition hover:border-brand-300">
              <div className="font-semibold text-brand-800">{c.name}</div>
              <p className="mt-1 text-sm text-neutral-600">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="card grid gap-6 sm:grid-cols-3">
        {[
          ["1. Apply", "Tell us about your business. Accounts are approved within one business day."],
          ["2. Order online", "See wholesale case pricing and live stock, then check out in minutes."],
          ["3. Get delivered", "Refrigerated trucks deliver to your dock on your route day."],
        ].map(([title, body]) => (
          <div key={title}>
            <div className="font-semibold">{title}</div>
            <p className="mt-1 text-sm text-neutral-600">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
