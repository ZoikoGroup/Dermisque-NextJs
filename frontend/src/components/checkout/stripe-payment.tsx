"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { useEffect } from "react";
import type { PlaceOrderInput } from "@/app/actions/store";

export type PaymentConfig = { provider: "stripe" | "demo"; publishableKey: string | null };

/** Saved before Stripe confirms, so /checkout/complete can place the order after a redirect. */
export const PENDING_ORDER_KEY = "dq-pending-order";
export type PendingOrder = PlaceOrderInput & { paymentIntentId: string };

const loaders = new Map<string, Promise<Stripe | null>>();
export function getStripe(key: string) {
  let p = loaders.get(key);
  if (!p) {
    p = loadStripe(key);
    loaders.set(key, p);
  }
  return p;
}

const appearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#0f3d35",
    colorText: "#0b0b0f",
    colorDanger: "#b42318",
    borderRadius: "14px",
    fontFamily: "inherit",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { padding: "13px 14px", boxShadow: "none", borderColor: "#e7dfd2" },
    ".Input:focus": { borderColor: "#c99a3b", boxShadow: "0 0 0 4px rgba(255,179,0,0.15)" },
    ".Tab": { borderColor: "#e7dfd2", boxShadow: "none" },
    ".Tab--selected": { borderColor: "#0f3d35" },
  },
};

/** Stripe Elements in deferred mode: the PaymentIntent is created only when the customer pays. */
export function StripeElements({
  publishableKey,
  amount,
  currency,
  children,
}: {
  publishableKey: string;
  amount: number;
  currency: string;
  children: React.ReactNode;
}) {
  return (
    <Elements
      stripe={getStripe(publishableKey)}
      options={{ mode: "payment", amount: Math.max(amount, 1), currency: currency.toLowerCase(), appearance }}
    >
      {children}
    </Elements>
  );
}

/** Hands the Stripe instances to the checkout form, which lives outside the Elements context. */
export function StripeBridge({ onReady }: { onReady: (s: { stripe: Stripe; elements: StripeElements } | null) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  useEffect(() => {
    onReady(stripe && elements ? { stripe, elements } : null);
  }, [stripe, elements, onReady]);
  return null;
}

export function StripePaymentFields({ onComplete }: { onComplete: (complete: boolean) => void }) {
  return (
    <PaymentElement
      options={{ layout: { type: "tabs", defaultCollapsed: false } }}
      onChange={(e) => onComplete(e.complete)}
    />
  );
}
