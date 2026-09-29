import Link from "next/link";
import { siteConfig } from "@/config/site";
import { photoCredits } from "@/config/photos";
import { Crest } from "@/components/brand/crest";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[auto_1fr_1fr_1fr] md:gap-16">
        <Crest className="size-28 text-accent-ink" label={siteConfig.name} />
        <div>
          <p className="eyebrow mb-4">Visit</p>
          <p className="text-sm leading-7 text-fg-2">{siteConfig.address}</p>
        </div>
        <div>
          <p className="eyebrow mb-4">Talk to us</p>
          <p className="text-sm leading-7 text-fg-2">
            <a href={`tel:${siteConfig.supportPhone.replace(/[^\d+]/g, "")}`} className="link">{siteConfig.supportPhone}</a>
            <br />
            <a href={`mailto:${siteConfig.supportEmail}`} className="link">{siteConfig.supportEmail}</a>
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4">Trade</p>
          <ul className="space-y-1 text-sm leading-7 text-fg-2">
            <li><Link href="/catalog" className="link">The catalog</Link></li>
            <li><Link href="/register" className="link">Apply for an account</Link></li>
            <li><Link href="/login" className="link">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="container-page flex flex-col gap-3 border-t border-line py-6 text-xs text-fg-3 md:flex-row md:justify-between">
        <p>
          © {year} {siteConfig.name}. Wholesale accounts only; prices are shown to approved accounts.
        </p>
        <p>
          Photography on Unsplash by{" "}
          {photoCredits.map((p, i) => (
            <span key={p.src}>
              <a href={p.profileUrl} className="link" rel="noopener noreferrer" target="_blank">{p.photographer}</a>
              {i < photoCredits.length - 2 ? ", " : i === photoCredits.length - 2 ? " and " : "."}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
