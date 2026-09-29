import { stagger } from "@/lib/motion";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { photos } from "@/config/photos";
import { listCategories, type Category } from "@/lib/categories";
import { Hero } from "@/components/hero";
import { CategoryTile } from "@/components/category-tile";
import { SectionHeading } from "@/components/section-heading";
import { Photo } from "@/components/photo";
import { ArrowRight } from "@/components/icons";

const acts = [
  {
    numeral: "I",
    title: "Apply",
    body: "Tell us about your kitchen or store. Accounts are approved within one business day.",
  },
  {
    numeral: "II",
    title: "Order",
    body: "See wholesale pricing and live stock, then place your order in minutes.",
  },
  {
    numeral: "III",
    title: "Receive",
    body: "Refrigerated trucks deliver to your dock on your route day.",
  },
];

export default async function HomePage() {
  // The home page should still render if Firestore is briefly unreachable.
  const categories: Category[] = await listCategories().catch((err) => {
    console.error("Categories unavailable:", err);
    return [];
  });

  return (
    <>
      <Hero
        photo={photos.hero}
        eyebrow={`Wholesale provisions · ${siteConfig.city}`}
        title={
          <>
            <span className="line"><span style={stagger(1)}>The harvest,</span></span>{" "}
            <span className="line"><em className="text-accent-ink" style={stagger(2)}>by the case.</em></span>
          </>
        }
        lede={siteConfig.tagline}
        actions={
          <>
            <Link href="/catalog" className="btn-primary btn-lg">
              Enter the catalog <ArrowRight width={16} height={16} />
            </Link>
            <Link href="/register" className="btn-secondary btn-lg">Apply for an account</Link>
          </>
        }
        facts={[
          { label: "For the trade", value: "Approved wholesale accounts only" },
          { label: "Priced plainly", value: "Per case, pack or bag, shown to account holders" },
          { label: "From the heartland", value: siteConfig.address },
        ]}
      />

      {categories.length > 0 && (
        <section aria-labelledby="categories-title" className="py-24 md:py-32">
          <div className="container-page">
            <SectionHeading
              eyebrow="The larder"
              title={<span id="categories-title">Shop by category</span>}
              lede="Chosen for kitchens and counters that notice the difference."
              action={
                <Link href="/catalog" className="btn-ghost">
                  The full catalog <ArrowRight width={16} height={16} />
                </Link>
              }
              className="reveal"
            />
          </div>
          <div className="container-page mt-14">
            <div className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
              {categories.map((c, i) => (
                <div key={c.id} className="reveal w-[82vw] shrink-0 snap-start sm:w-auto" style={stagger(i)}>
                  <CategoryTile category={c} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="how-title" className="relative isolate overflow-hidden py-28 md:py-40">
        <div className="parallax absolute inset-0 -z-10">
          <Photo photo={photos.delivery} decorative sizes="100vw" className="absolute -inset-y-[12%] inset-x-0" />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,var(--bg)_0%,rgb(14_12_10/0.78)_22%,rgb(14_12_10/0.78)_78%,var(--bg)_100%)]" />
        <div className="container-page">
          <SectionHeading
            eyebrow="How it works"
            title={<span id="how-title">From our dock <em className="text-accent-ink">to yours.</em></span>}
            className="reveal"
          />
          <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
            {acts.map((a, i) => (
              <li key={a.title} className="reveal border-t border-line-strong pt-8" style={stagger(i)}>
                <span className="font-display text-5xl text-accent-ink italic" aria-hidden>{a.numeral}</span>
                <h3 className="mt-6 text-title-m">{a.title}</h3>
                <p className="mt-3 max-w-sm text-fg-2">{a.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
