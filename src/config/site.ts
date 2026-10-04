/**
 * Company / storefront settings. Change the branding here in one place.
 * (Prairie Crest Foods is a made-up placeholder company.)
 */
export const siteConfig = {
  name: "Prairie Crest Foods",
  shortName: "Prairie Crest",
  tagline: "Wholesale provisions for the Midwest's most exacting kitchens and grocers.",
  description:
    "Prairie Crest Foods supplies more than 10,000 wholesale customers across the Midwest, from chef-led restaurants to fine grocers.",
  /** City shown in eyebrows; keep in step with `address`. */
  city: "Des Moines, Iowa",
  supportEmail: "orders@prairiecrestfoods.example",
  supportPhone: "(515) 555-0142",
  address: "4120 Harvest Way, Des Moines, IA 50313",
  /** B2B: wholesale prices are only shown to approved, signed-in customers. */
  showPricesToGuests: false,
  /** Minimum order subtotal in cents (0 = no minimum). */
  minimumOrderCents: 0,
  currency: "usd",
} as const;

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
