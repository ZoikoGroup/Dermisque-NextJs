import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { OrderSummary } from "@/components/account/order-summary";
import { SuccessBurst } from "@/components/checkout/success-burst";
import { ButtonLink } from "@/components/ui/button";
import { apiOrNull } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function OrderSuccess({ params }: PageProps<"/order-success/[orderNumber]">) {
  const { orderNumber } = await params;
  await requireUser(`/order-success/${orderNumber}`);
  const order = await apiOrNull<Order>(`/api/account/orders/${encodeURIComponent(orderNumber)}`);
  if (!order) notFound();

  return (
    <div className="container-luxe max-w-3xl py-16">
      <SuccessBurst />
      <div className="text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-brand">
          <CheckCircle2 className="size-10" />
        </div>
        <p className="eyebrow mt-6">Order {order.orderNumber}</p>
        <h1 className="mt-3 font-display text-5xl">Thank you, {order.address.fullName.split(" ")[0]}!</h1>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          Your order is confirmed
          {order.paymentMethod === "COD" ? " — pay on delivery." : " and payment received."} We&apos;ll
          email you when it ships. Estimated delivery: 2–7 days.
        </p>
      </div>

      <div className="mt-12">
        <OrderSummary order={order} />
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink href={`/account/orders/${order.orderNumber}`}>Track this order</ButtonLink>
        <ButtonLink href="/shop" variant="outline">
          Continue shopping
        </ButtonLink>
      </div>
    </div>
  );
}
