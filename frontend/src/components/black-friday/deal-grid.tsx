"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCurrency, usePrice } from "@/components/store/currency-provider";
import {
  dealImage,
  dealTint,
  productCartItem,
  SERUM_LABEL,
  serumType,
  shortName,
  saleDay,
  type BlackFriday,
  type SerumType,
} from "@/lib/black-friday";
import { CURRENCIES } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { Pill, Ribbons, Seal } from "./parts";

const TABS: { key: "all" | SerumType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "face", label: "Face" },
  { key: "lip", label: "Lip" },
  { key: "hair", label: "Hair" },
];

export function DealGrid({ data }: { data: BlackFriday }) {
  const [tab, setTab] = useState<"all" | SerumType>("all");
  const price = usePrice();
  const { currency } = useCurrency();
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState<string | null>(null);

  const counts = { all: data.products.length, face: 0, lip: 0, hair: 0 };
  for (const p of data.products) counts[serumType(p.slug)]++;
  const shown = data.products.filter((p) => tab === "all" || serumType(p.slug) === tab);

  return (
    <section id="singles" className="relative scroll-mt-24 overflow-hidden px-4 py-16 sm:py-20">
      <Seal pct={data.singlePct} className="absolute -left-4 top-6 hidden w-28 text-sm md:grid lg:left-8 lg:w-32 lg:text-base" />
      <Ribbons className="absolute right-6 top-0 w-20 sm:w-24" />

      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <Pill>Black Friday · Singles</Pill>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            <span className="text-[#e11d2e]">{data.singlePct}% OFF</span> every Dermisque serum
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-mute">
            {data.live
              ? "Every price below already includes the Black Friday discount."
              : `Black Friday prices go live ${saleDay(data.startsAt)} — here's a preview.`}{" "}
            Prices in {CURRENCIES[currency].symbol} include taxes.
          </p>

          <div role="tablist" aria-label="Filter serums" className="mt-6 inline-flex flex-wrap justify-center gap-2">
            {TABS.filter((t) => t.key === "all" || counts[t.key] > 0).map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-[3px] border px-4 py-1.5 text-[0.66rem] font-bold uppercase tracking-[0.16em] transition",
                  tab === t.key ? "border-ink bg-ink text-white" : "border-ink/70 bg-white hover:bg-ink hover:text-white",
                )}
              >
                {t.label}
                {t.key === "all" && ` ${counts.all}`}
              </button>
            ))}
          </div>
        </div>

        <motion.ul layout className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {shown.map((p, i) => {
              const soldOut = p.stock <= 0;
              const save = p.regularPrice - p.price;
              return (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.45, delay: Math.min(i, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex flex-col rounded-md border border-ink/5 p-2.5 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_22px_40px_-22px_rgba(74,22,6,0.45)] sm:p-3"
                  style={{ backgroundColor: dealTint(p.slug) }}
                >
                  <Link href={`/product/${p.slug}`} className="relative block overflow-hidden rounded-sm bg-white">
                    <span className="absolute left-2 top-2 z-10 rounded-sm bg-[#e11d2e] px-1.5 py-0.5 text-[0.62rem] font-bold text-white">
                      -{data.singlePct}%
                    </span>
                    <span className="absolute right-2 top-2 z-10 rounded-sm bg-ink px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-white">
                      Black Friday
                    </span>
                    <Image
                      src={dealImage(p)}
                      alt={p.name}
                      width={444}
                      height={416}
                      sizes="(min-width:1024px) 260px, (min-width:768px) 30vw, 45vw"
                      className="aspect-[222/208] h-auto w-full object-contain transition duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.06]"
                    />
                    {soldOut && (
                      <span className="absolute inset-0 grid place-items-center bg-white/70 text-xs font-bold uppercase tracking-widest">
                        Sold out
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col px-0.5 pt-3">
                    <Link href={`/product/${p.slug}`} className="text-[0.82rem] font-medium leading-snug hover:underline sm:text-sm">
                      {p.name}
                    </Link>
                    <p className="mt-1 text-[0.6rem] uppercase tracking-[0.18em] text-mute">{SERUM_LABEL[serumType(p.slug)]}</p>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
                      <span className="text-xs text-mute line-through">{price(p.regularPrice)}</span>
                      <span className="text-lg font-bold">{price(p.price)}</span>
                    </div>
                    <p className="text-[0.66rem] font-semibold text-[#e11d2e]">
                      Save {price(save)} · {data.singlePct}% off
                    </p>
                    <div className="mt-auto pt-3">
                      <button
                        type="button"
                        disabled={soldOut || !data.live}
                        onClick={() => {
                          add(productCartItem(p));
                          setAdded(p.id);
                          setTimeout(() => setAdded((a) => (a === p.id ? null : a)), 1600);
                          toast.success(`${shortName(p.name)} added to basket`);
                        }}
                        className="sheen flex h-9 w-full items-center justify-center gap-1.5 rounded-[3px] bg-ink text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#2a2a33] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-ink/40 sm:text-[0.66rem]"
                      >
                        {added === p.id ? (
                          <>
                            <Check className="size-3.5" /> Added
                          </>
                        ) : soldOut ? (
                          "Sold out"
                        ) : data.live ? (
                          <>
                            <ShoppingBag className="size-3.5" /> Add to basket
                          </>
                        ) : (
                          `Available ${saleDay(data.startsAt)}`
                        )}
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      </div>
    </section>
  );
}
