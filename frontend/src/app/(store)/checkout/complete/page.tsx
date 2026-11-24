import type { Metadata } from "next";
import { Suspense } from "react";
import { CompletePayment } from "@/components/checkout/complete-payment";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Completing your order", robots: { index: false } };

/** Stripe sends customers back here after payment methods that leave the site (Klarna, bank apps, 3-D Secure). */
export default async function CheckoutCompletePage() {
  await requireUser("/checkout");
  return (
    <Suspense>
      <CompletePayment />
    </Suspense>
  );
}
