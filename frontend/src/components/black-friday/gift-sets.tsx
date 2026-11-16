"use client";

import Image from "next/image";
import { usePrice } from "@/components/store/currency-provider";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { shortName, type BlackFriday } from "@/lib/black-friday";
import { BundleButton } from "./combo-grid";

export function GiftSets({ data }: { data: BlackFriday }) {
  const price = usePrice();
  const gifts = data.bundles.filter((b) => b.kind === "gift");
  if (!gifts.length) return null;

  return (
    <section id="gifts" className="scroll-mt-24 px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl">Giftable Sets</h2>
          <p className="mt-2 text-sm text-mute">Beautifully considered gifts for the season.</p>
        </div>
        <Stagger className="mt-10 grid gap-6 lg:grid-cols-2">
          {gifts.map((g) => (
            <StaggerItem key={g.key}>
              <article className="group grid h-full overflow-hidden rounded-sm bg-white shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)] sm:grid-cols-[1fr_1.05fr]">
                <div className="relative overflow-hidden bg-[#f4efe7]">
                  <Image
                    src={g.image}
                    alt={`${g.name}: ${g.items.map((i) => shortName(i.name)).join(", ")}`}
                    width={302}
                    height={432}
                    sizes="(min-width:1024px) 280px, (min-width:640px) 45vw, 92vw"
                    className="mx-auto h-full max-h-[26rem] w-auto object-contain transition duration-1000 ease-[var(--ease-luxe)] group-hover:scale-[1.05]"
                  />
                </div>
                <div className="flex flex-col p-6 sm:p-8">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#b8862f]">Giftable set</p>
                  <h3 className="mt-2 font-display text-3xl">{g.name}</h3>
                  <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
                    {g.items.map((i) => (
                      <li key={i.id} className="flex gap-2">
                        <span className="text-[#b8862f]">•</span>
                        {i.name}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    {data.live ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-mute line-through">{price(g.regularPrice)}</span>
                          <span className="font-display text-3xl">{price(g.price)}</span>
                        </div>
                        <p className="text-xs font-semibold text-[#e11d2e]">
                          {data.comboPct}% off · you save {price(g.regularPrice - g.price)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-xl italic">Set price revealed on Black Friday</p>
                        <p className="mt-1 text-xs text-mute">Worth {price(g.regularPrice)} at regular prices.</p>
                      </>
                    )}
                  </div>
                  <BundleButton
                    bundle={g}
                    live={data.live}
                    startsAt={data.startsAt}
                    label="Add set to bag"
                    className="mt-auto bg-ink text-white hover:bg-[#2a2a33] sm:mt-6"
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
