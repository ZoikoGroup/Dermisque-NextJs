export const CURRENCIES = {
  USD: { code: "USD", label: "United States (US) dollar", symbol: "$", locale: "en-US" },
  GBP: { code: "GBP", label: "Pound sterling", symbol: "£", locale: "en-GB" },
} as const;

export type Currency = keyof typeof CURRENCIES;
export type Rates = Record<Currency, number>;

export const CURRENCY_COOKIE = "dq_currency";
export const DEFAULT_RATES: Rates = { USD: 1, GBP: 0.79 };

export const isCurrency = (v: unknown): v is Currency => typeof v === "string" && v in CURRENCIES;

const formatters = new Map<Currency, Intl.NumberFormat>();

/** Format USD cents in `currency`, converting at `rate` (USD → currency). */
export function formatMoney(usdCents: number, currency: Currency = "USD", rate = 1) {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat(CURRENCIES[currency].locale, { style: "currency", currency });
    formatters.set(currency, f);
  }
  return f.format(Math.round(usdCents * rate) / 100);
}

/** Format an order's amounts in the currency the customer placed it in. */
export function formatOrderMoney(usdCents: number, order: { currency?: string; fxRate?: number }) {
  return formatMoney(usdCents, isCurrency(order.currency) ? order.currency : "USD", order.fxRate ?? 1);
}
