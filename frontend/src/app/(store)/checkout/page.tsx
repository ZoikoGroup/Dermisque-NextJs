import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import type { PaymentConfig } from "@/components/checkout/stripe-payment";
import { api } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import type { Address, User } from "@/lib/types";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  await requireUser("/checkout");
  const [addresses, me, payments] = await Promise.all([
    api<Address[]>("/api/account/addresses"),
    api<User>("/api/auth/me"),
    api<PaymentConfig>("/api/checkout/payment-config", { auth: false }).catch(
      (): PaymentConfig => ({ provider: "demo", publishableKey: null }),
    ),
  ]);
  return <CheckoutForm addresses={addresses} user={{ name: me.name, phone: me.phone ?? "" }} payments={payments} />;
}
