"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { site } from "@/lib/site";
import { CURRENCY_COOKIE, DEFAULT_RATES, formatMoney, type Currency, type Rates } from "@/lib/currency";

type Ctx = {
  currency: Currency;
  rates: Rates;
  pending: boolean;
  setCurrency: (c: Currency) => void;
  format: (usdCents: number) => string;
};

const CurrencyContext = createContext<Ctx>({
  currency: "USD",
  rates: DEFAULT_RATES,
  pending: false,
  setCurrency: () => {},
  format: (c) => formatMoney(c),
});

export function CurrencyProvider({
  initial,
  rates,
  children,
}: {
  initial: Currency;
  rates: Rates;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currency, setState] = useState<Currency>(initial);
  const [pending, start] = useTransition();

  const setCurrency = useCallback(
    (c: Currency) => {
      setState(c);
      document.cookie = `${CURRENCY_COOKIE}=${c}; path=/; max-age=31536000; samesite=lax`;
      start(() => router.refresh()); // re-render server components in the new currency
    },
    [router],
  );

  const value = useMemo<Ctx>(
    () => ({
      currency,
      rates,
      pending,
      setCurrency,
      format: (usdCents) => formatMoney(usdCents, currency, rates[currency]),
    }),
    [currency, rates, pending, setCurrency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);

/** Formats USD cents in the shopper's selected currency. */
export const usePrice = () => useContext(CurrencyContext).format;

/** Drop-in price for server components. */
export function Price({ cents }: { cents: number }) {
  return <>{usePrice()(cents)}</>;
}

/** Renders a label with "{amount}" replaced by the free-shipping threshold in the selected currency. */
export function FreeShippingText({ template }: { template: string }) {
  const format = usePrice();
  const [before, after] = template.split("{amount}");
  return (
    <>
      {before}
      {format(site.freeShippingThreshold).replace(/[.,]00$/, "")}
      {after}
    </>
  );
}
