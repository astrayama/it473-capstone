import type { Metadata } from "next";
import { canOrder, getSession } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";
import { CartView } from "@/components/cart/cart-view";
import { SectionHeading } from "@/components/section-heading";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = { title: "Your order" };

export default async function CartPage(props: PageProps<"/cart">) {
  const sp = await props.searchParams;
  const session = await getSession();
  return (
    <PageTransition>
      <div className="container-page py-16 md:py-20">
        <SectionHeading as="h1" size="l" eyebrow="Your order" title={<>Ready <em className="text-accent-ink">for the dock.</em></>} />
        <div className="mt-12">
          <CartView
            signedIn={Boolean(session)}
            canOrder={canOrder(session)}
            accountStatus={session?.customer?.status ?? null}
            stripeConfigured={isStripeConfigured()}
            cancelled={sp.cancelled === "1"}
          />
        </div>
      </div>
    </PageTransition>
  );
}
