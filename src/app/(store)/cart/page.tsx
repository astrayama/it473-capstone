import type { Metadata } from "next";
import { canOrder, getSession } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage(props: PageProps<"/cart">) {
  const sp = await props.searchParams;
  const session = await getSession();
  return (
    <div className="container-page space-y-6 py-8">
      <h1 className="text-3xl font-bold">Your cart</h1>
      <CartView
        signedIn={Boolean(session)}
        canOrder={canOrder(session)}
        accountStatus={session?.customer?.status ?? null}
        stripeConfigured={isStripeConfigured()}
        cancelled={sp.cancelled === "1"}
      />
    </div>
  );
}
