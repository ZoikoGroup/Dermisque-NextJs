"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { motion } from "motion/react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { usePrice } from "@/components/store/currency-provider";
import { cn } from "@/lib/utils";

type Concern = { slug: string; name: string; productCount: number };

const sorts = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top rated" },
  { value: "name", label: "Name A–Z" },
];

const priceBands = [
  { min: "", max: "30" },
  { min: "30", max: "45" },
  { min: "45", max: "" },
];

export function ShopFilters({ concerns, count }: { concerns: Concern[]; count: number }) {
  const price = usePrice();
  // Bands are in USD; labels follow the shopper's currency (trailing .00 trimmed).
  const amt = (usd: string) => price(Number(usd) * 100).replace(/[.,]00$/, "");
  const bandLabel = (b: (typeof priceBands)[number]) =>
    !b.min ? `Under ${amt(b.max)}` : !b.max ? `${amt(b.min)}+` : `${amt(b.min)} – ${amt(b.max)}`;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  // debounce search typing
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => set({ q: q.trim() || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const concern = params.get("concern");
  const sort = params.get("sort") ?? "featured";
  const min = params.get("min") ?? "";
  const max = params.get("max") ?? "";
  const active = [concern, params.get("q"), min, max].filter(Boolean).length;

  return (
    <div className="sticky top-16 z-30 -mx-4 border-y border-line bg-cream/85 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-3xl sm:border sm:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search serums…"
            className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm outline-none transition focus:border-amber focus:ring-4 focus:ring-amber/15"
          />
        </label>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm transition hover:border-ink lg:hidden"
        >
          <SlidersHorizontal className="size-4" /> Filters {active > 0 && <span className="rounded-full bg-brand px-1.5 text-xs">{active}</span>}
        </button>

        <select
          value={sort}
          onChange={(e) => set({ sort: e.target.value === "featured" ? null : e.target.value })}
          className="h-11 rounded-full border border-line bg-white px-4 text-sm outline-none transition hover:border-ink"
          aria-label="Sort products"
        >
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <p className="ml-auto flex items-center gap-2 text-sm text-mute">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {count} {count === 1 ? "product" : "products"}
        </p>
      </div>

      <div className={cn("mt-4 flex-wrap items-center gap-2", open ? "flex" : "hidden lg:flex")}>
        <Chip active={!concern} onClick={() => set({ concern: null })}>
          All
        </Chip>
        {concerns.map((c) => (
          <Chip key={c.slug} active={concern === c.slug} onClick={() => set({ concern: concern === c.slug ? null : c.slug })}>
            {c.name}
            <span className="ml-1 text-[0.7rem] opacity-50">{c.productCount}</span>
          </Chip>
        ))}
        <span className="mx-2 hidden h-6 w-px bg-line lg:block" />
        {priceBands.map((b) => {
          const on = min === b.min && max === b.max;
          return (
            <Chip key={b.min + b.max} active={on} onClick={() => set(on ? { min: null, max: null } : { min: b.min || null, max: b.max || null })}>
              {bandLabel(b)}
            </Chip>
          );
        })}
        {active > 0 && (
          <button
            onClick={() => {
              setQ("");
              start(() => router.replace(pathname, { scroll: false }));
            }}
            className="ml-1 flex items-center gap-1 text-sm text-mute underline-offset-4 hover:text-ink hover:underline"
          >
            <X className="size-3.5" /> Clear all
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-full border px-4 py-1.5 text-sm transition-colors duration-300",
        active ? "border-ink text-white" : "border-line bg-white hover:border-ink",
      )}
    >
      {active && (
        <motion.span
          layoutId="chip-bg"
          className="absolute inset-0 -z-0 rounded-full bg-ink"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
