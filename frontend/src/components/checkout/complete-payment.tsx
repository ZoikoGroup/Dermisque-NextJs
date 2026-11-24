"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { placeOrder } from "@/app/actions/store";
import { ButtonLink } from "@/components/ui/button";
import { PENDING_ORDER_KEY, type PendingOrder } from "@/components/checkout/stripe-payment";
import { useCart } from "@/store/cart";

export function CompletePayment() {
  const params = useSearchParams();
  const router = useRouter();
  const clear = useCart((s) => s.clear);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const intentId = params.get("payment_intent");
    const status = params.get("redirect_status");
    let pending: PendingOrder | null = null;
    try {
      pending = JSON.parse(sessionStorage.getItem(PENDING_ORDER_KEY) ?? "null");
    } catch {}

    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot outcome of the redirect
    if (status !== "succeeded") return setError("Your payment was not completed, so you have not been charged.");
    if (!pending || pending.paymentIntentId !== intentId)
      return setError("Your payment went through, but we couldn't find your order details. Please contact us with this reference: " + intentId);

    placeOrder(pending).then((res) => {
      if (res.ok) {
        try {
          sessionStorage.removeItem(PENDING_ORDER_KEY);
        } catch {}
        clear();
        router.replace(`/order-success/${res.data.orderNumber}`);
      } else setError(res.error);
    });
  }, [params, router, clear]);

  return (
    <div className="container-luxe grid min-h-[60vh] place-items-center py-24 text-center">
      {error ? (
        <div className="max-w-lg">
          <h1 className="font-display text-4xl">We couldn&apos;t finish your order</h1>
          <p className="mt-4 text-ink-soft">{error}</p>
          <ButtonLink href="/checkout" className="mt-8">
            Back to checkout
          </ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-[#0f3d35]" />
          <p className="font-display text-2xl">Confirming your payment…</p>
        </div>
      )}
    </div>
  );
}
