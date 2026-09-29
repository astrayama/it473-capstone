import { getSession } from "@/lib/auth";
import { StoreChrome } from "@/components/store-chrome";

/** Storefront: dark "noir" theme with the site header and footer. */
export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  return <StoreChrome session={session}>{children}</StoreChrome>;
}
