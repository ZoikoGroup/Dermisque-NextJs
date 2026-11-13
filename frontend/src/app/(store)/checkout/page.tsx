import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { api } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import type { Address, User } from "@/lib/types";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  await requireUser("/checkout");
  const [addresses, me] = await Promise.all([
    api<Address[]>("/api/account/addresses"),
    api<User>("/api/auth/me"),
  ]);
  return <CheckoutForm addresses={addresses} user={{ name: me.name, phone: me.phone ?? "" }} />;
}
