import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-brand-100 bg-white">
      <div className="container-page flex flex-col gap-2 py-8 text-sm text-neutral-600 sm:flex-row sm:justify-between">
        <div>
          <div className="font-semibold text-brand-800">{siteConfig.name}</div>
          <div>{siteConfig.address}</div>
        </div>
        <div className="sm:text-right">
          <div>{siteConfig.supportPhone}</div>
          <div>{siteConfig.supportEmail}</div>
          <div className="mt-1 text-xs text-neutral-400">Wholesale accounts only. Prices per case.</div>
        </div>
      </div>
    </footer>
  );
}
