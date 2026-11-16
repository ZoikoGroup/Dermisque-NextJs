"use client";

import Image from "next/image";
import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { usePrice } from "@/components/store/currency-provider";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { bundleCartItem, shortName, ukDay, type BlackFriday, type DealBundle } from "@/lib/black-friday";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { Pill, Ribbons } from "./parts";

export function BundleButton({
  bundle,
  live,
  startsAt,
  label,
  className,
}: {
  bundle: DealBundle;
  live: boolean;
  startsAt: string;
  label: string;
  className?: string;
}) {
  const add = useCart((s) => s.add);
  const [done, setDone] = useState(false);
  const soldOut = bundle.stock <= 0;
  return (
    <button
      type="button"
      disabled={!live || soldOut}
      onClick={() => {
        add(bundleCartItem(bundle));
        setDone(true);
        setTimeout(() => setDone(false), 1600);
        toast.success(`${bundle.name} added to basket`);
      }}
      className={cn(
        "sheen flex h-11 w-full items-center justify-center gap-2 rounded-[3px] text-[0.66rem] font-bold uppercase tracking-[0.18em] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {done ? (
        <>
          <Check className="size-4" /> Added
        </>
      ) : soldOut ? (
        "Sold out"
      ) : live ? (
        <>
          <ShoppingBag className="size-4" /> {label}
        </>
      ) : (
        `Available ${ukDay(startsAt)}`
      )}
    </button>
  );
}

export function ComboGrid({ data }: { data: BlackFriday }) {
  const price = usePrice();
  const combos = data.bundles.filter((b) => b.kind === "combo");
  if (!combos.length) return null;

  return (
    <section id="combos" className="relative scroll-mt-24 overflow-hidden bg-white px-4 py-16 sm:py-20">
      {/* corner "Sale" sash */}
      <div className="pointer-events-none absolute -left-12 top-7 w-44 -rotate-45 bg-[linear-gradient(90deg,#8a3d05,#c96a0d)] py-1.5 text-center font-display text-sm italic text-white shadow-md sm:-left-10 sm:top-9">
        Sale
      </div>
      <Ribbons className="absolute right-6 top-0 w-20 sm:w-24" />

      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <Pill tone="amber">Black Friday combos</Pill>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            <span className="text-[#f0a830]">{data.comboPct}% OFF</span> serum combos
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-mute">
            Bundle up for the biggest saving of the year. Each set lists every serum and its regular price.
          </p>
        </div>

        <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {combos.map((b) => (
            <StaggerItem key={b.key}>
              <article
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-md bg-[#4a1606] p-4 text-white shadow-[0_24px_50px_-28px_rgba(74,22,6,0.9)] transition duration-500 hover:-translate-y-1.5",
                  b.badge && "ring-2 ring-[#ffc56b]",
                )}
              >
                {b.badge && (
                  <span className="absolute left-4 top-4 z-10 rounded-sm bg-[#ffc56b] px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-[#4a1606]">
                    {b.badge}
                  </span>
                )}
                <span className="absolute right-3 top-3 z-10 grid size-14 place-items-center rounded-full bg-[#ffc56b] text-center leading-none text-[#4a1606] shadow-lg ring-4 ring-[#ffc56b]/25 transition duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <span>
                    <span className="block text-base font-extrabold">{data.comboPct}%</span>
                    <span className="block text-[0.5rem] font-bold">OFF</span>
                  </span>
                </span>

                <div className="relative -mx-4 -mt-4 overflow-hidden bg-[radial-gradient(ellipse_at_50%_80%,#7a2d0c_0%,#4a1606_70%)] px-4 pt-6">
                  <Image
                    src={b.image}
                    alt={`${b.name}: ${b.items.map((i) => shortName(i.name)).join(", ")}`}
                    width={680}
                    height={404}
                    sizes="(min-width:1024px) 360px, (min-width:640px) 45vw, 90vw"
                    className="h-auto w-full transition duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.05]"
                  />
                </div>

                <h3 className="mt-4 text-lg font-bold">{b.name}</h3>
                <p className="text-xs text-white/60">{b.subtitle}</p>

                <ul className="mt-3 divide-y divide-white/10 border-y border-white/10 text-xs">
                  {b.items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3 py-2">
                      <span className="text-white/85">{shortName(i.name)}</span>
                      <span className="shrink-0 text-white/55">{price(i.regularPrice)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-white/50 line-through">{price(b.regularPrice)}</span>
                    <span className="text-2xl font-extrabold">{price(b.price)}</span>
                  </div>
                  <p className="text-[0.7rem] font-semibold text-[#ffc56b]">You save {price(b.regularPrice - b.price)} on the set</p>
                  <BundleButton
                    bundle={b}
                    live={data.live}
                    startsAt={data.startsAt}
                    label="Add combo to basket"
                    className="mt-4 bg-[#ffc56b] text-[#4a1606] hover:bg-[#ffd48a]"
                  />
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
