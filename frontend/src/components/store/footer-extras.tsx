"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useCurrency } from "./currency-provider";
import { openChat } from "./nav-menus";
import type { Currency } from "@/lib/currency";

/** A footer link that opens the chat assistant; falls back to the href without JS. */
export function ChatLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        openChat();
      }}
    >
      {children}
    </Link>
  );
}

const REGIONS: { value: Currency; label: string }[] = [
  { value: "USD", label: "United States / USD ($)" },
  { value: "GBP", label: "United Kingdom / GBP (£)" },
];

export function FooterCurrency() {
  const { currency, setCurrency, pending } = useCurrency();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Region and currency</span>
      <select
        value={currency}
        disabled={pending}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="cursor-pointer appearance-none bg-transparent py-1 pr-9 text-sm font-semibold uppercase tracking-wide text-white outline-none disabled:opacity-60 [&>option]:text-ink"
      >
        {REGIONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1 size-4 text-[#d9b46a]" />
    </label>
  );
}
