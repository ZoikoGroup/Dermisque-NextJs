"use client";

import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type Stripe,
  type StripeCardNumberElement,
  type StripeElementChangeEvent,
  type StripeElements,
  type StripeElementStyle,
} from "@stripe/stripe-js";
import { useEffect, useRef, useState } from "react";
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

/* ───────────── Animated card form (Stripe card fields) ─────────────
   The digits stay inside Stripe's secure fields; the page only learns the brand, whether each field is
   complete, and, once the card is complete, its last 4 digits and expiry (to show on the card preview). */

export type StripeCard = { stripe: Stripe; number: StripeCardNumberElement };
export type CardState = {
  brand: string; // "VISA" | "Mastercard" | "AMEX" | "Discover" | ... | ""
  started: boolean;
  number: boolean;
  expiry: boolean;
  cvc: boolean;
  last4: string | null;
  exp: string | null; // "MM/YY"
};
export const EMPTY_CARD: CardState = { brand: "", started: false, number: false, expiry: false, cvc: false, last4: null, exp: null };

const BRANDS: Record<string, string> = {
  visa: "VISA",
  mastercard: "Mastercard",
  amex: "AMEX",
  discover: "Discover",
  diners: "Diners Club",
  jcb: "JCB",
  unionpay: "UnionPay",
};

const fieldStyle: StripeElementStyle = {
  base: {
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif",
    fontSize: "15.5px",
    color: "#0b0b0f",
    letterSpacing: "0.04em",
    "::placeholder": { color: "#a19a90" },
  },
  invalid: { color: "#b42318" },
};

/** Elements group for the card fields (separate from the Payment Element used for other methods). */
export function CardElements({ publishableKey, children }: { publishableKey: string; children: React.ReactNode }) {
  return (
    <Elements
      stripe={getStripe(publishableKey)}
      options={{ fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Jost:wght@400;500&display=swap" }] }}
    >
      {children}
    </Elements>
  );
}

type Field = "number" | "expiry" | "cvc";

export function StripeCardFields({
  onReady,
  onChange,
  onCvcFocus,
  field,
  nameField,
}: {
  onReady: (c: StripeCard | null) => void;
  onChange: React.Dispatch<React.SetStateAction<CardState>>;
  onCvcFocus: (focused: boolean) => void;
  field: (label: string, icon: "card" | "date" | "lock", el: React.ReactNode, wide?: boolean) => React.ReactNode;
  nameField: React.ReactNode;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [mounted, setMounted] = useState(false);
  const done = useRef<Record<Field, boolean>>({ number: false, expiry: false, cvc: false });
  const lookup = useRef(0);
  const [errors, setErrors] = useState<Record<Field, string | null>>({ number: null, expiry: null, cvc: null });

  useEffect(() => {
    const el = elements?.getElement(CardNumberElement);
    if (stripe && el && mounted) onReady({ stripe, number: el });
    return () => onReady(null);
  }, [stripe, elements, mounted, onReady]);

  useEffect(() => () => onChange(EMPTY_CARD), [onChange]);

  const handle = (f: Field, e: StripeElementChangeEvent & { brand?: string }) => {
    done.current[f] = e.complete;
    setErrors((x) => ({ ...x, [f]: e.error?.message ?? null }));
    const ticket = ++lookup.current;
    onChange((s) => ({
      ...s,
      ...(f === "number" ? { brand: BRANDS[e.brand ?? ""] ?? "", started: !e.empty } : {}),
      [f]: e.complete,
      last4: null,
      exp: null,
    }));
    const el = elements?.getElement(CardNumberElement);
    if (stripe && el && done.current.number && done.current.expiry && done.current.cvc) {
      // Stripe turns the complete card into a token-like PaymentMethod; it tells us last 4 + expiry, never the number
      stripe.createPaymentMethod({ type: "card", card: el }).then(({ paymentMethod }) => {
        if (ticket !== lookup.current || !paymentMethod?.card) return;
        const c = paymentMethod.card;
        onChange((s) => ({
          ...s,
          last4: c.last4,
          exp: `${String(c.exp_month).padStart(2, "0")}/${String(c.exp_year).slice(-2)}`,
        }));
      });
    }
  };

  const error = errors.number ?? errors.expiry ?? errors.cvc;
  const cls = "input !py-[13px]";
  return (
    <div className="p-0.5">
      <div className="grid gap-4 sm:grid-cols-2">
        {field(
          "Card number",
          "card",
          <CardNumberElement
            className={cls}
            options={{ style: fieldStyle, placeholder: "1234 1234 1234 1234", showIcon: false, disableLink: true }}
            onReady={() => setMounted(true)}
            onChange={(e) => handle("number", e)}
          />,
          true,
        )}
        {nameField}
        {field("Expiry", "date", <CardExpiryElement className={cls} options={{ style: fieldStyle }} onChange={(e) => handle("expiry", e)} />)}
        {field(
          "CVC",
          "lock",
          <CardCvcElement
            className={cls}
            options={{ style: fieldStyle, placeholder: "123" }}
            onChange={(e) => handle("cvc", e)}
            onFocus={() => onCvcFocus(true)}
            onBlur={() => onCvcFocus(false)}
          />,
        )}
      </div>
      {error && <p className="mt-3 text-sm text-[#b42318]">{error}</p>}
    </div>
  );
}
