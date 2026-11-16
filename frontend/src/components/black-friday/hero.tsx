import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { BF_IMG, ukDay, type BlackFriday } from "@/lib/black-friday";
import { Ribbons, Seal } from "./parts";

export function BlackFridayHero({ data }: { data: BlackFriday }) {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-[1600px] overflow-hidden bg-[linear-gradient(170deg,#f6e7c9_0%,#ead2a6_100%)] lg:aspect-[1440/560] lg:bg-none">
        {/* full artwork on desktop (cream panel + model) */}
        <Image
          src={`${BF_IMG}/hero-banner.webp`}
          alt=""
          fill
          priority
          sizes="100vw"
          className="hidden object-cover object-left-top lg:block"
        />

        <div className="relative grid lg:absolute lg:inset-0 lg:grid-cols-2">
          {/* copy */}
          <div className="relative z-10 px-6 pb-8 pt-12 sm:px-10 lg:px-[6%] lg:pb-0 lg:pt-[6%]">
            <Ribbons className="absolute right-6 top-0 w-24 lg:hidden" />
            <p className="bf-rise text-[0.66rem] font-semibold uppercase tracking-[0.3em] text-[#7a5a2b]">
              Dermisque · Black Friday
            </p>
            <h1 className="bf-rise mt-4 max-w-[13ch] font-sans text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-ink [animation-delay:.08s] sm:text-6xl xl:text-7xl">
              Your skincare ritual.{" "}
              <em className="bg-[linear-gradient(100deg,#8a3d05_0%,#c96a0d_55%,#f09a2a_100%)] bg-clip-text font-extrabold not-italic text-transparent [font-style:italic]">
                Beautifully considered.
              </em>
            </h1>
            <p className="bf-rise mt-5 max-w-sm text-sm text-ink-soft [animation-delay:.16s] sm:text-base">
              {data.live
                ? `${data.singlePct}% off every serum and ${data.comboPct}% off combos — live now.`
                : "A beautiful season of skincare is almost here."}
            </p>
            <a
              href="#singles"
              className="bf-rise sheen group mt-7 inline-flex items-center gap-2 rounded-[3px] bg-ink px-7 py-3.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:shadow-xl [animation-delay:.24s]"
            >
              Shop the edit
              <ArrowDown className="size-3.5 transition group-hover:translate-y-0.5" />
            </a>
          </div>

          {/* model photo (mobile/tablet) — on desktop it is part of the artwork */}
          <div className="relative aspect-square max-h-[34rem] w-full overflow-hidden lg:hidden">
            <Image
              src={`${BF_IMG}/popup-model.png`}
              alt="Model presenting the Dermisque Black Friday edit"
              fill
              sizes="100vw"
              className="object-cover object-[30%_30%]"
            />
            <Seal pct={data.singlePct} className="absolute right-4 top-4 w-24 text-[13px] sm:right-8 sm:top-8 sm:w-32 sm:text-base" />
          </div>
        </div>

        <Seal
          pct={data.singlePct}
          className="absolute right-[5%] top-[20%] z-20 hidden w-[9.5%] min-w-28 text-[clamp(13px,1.35vw,22px)] lg:grid"
        />

        {/* product shelf straddling the two halves */}
        <div className="pointer-events-none relative z-10 mx-auto -mt-16 w-[92%] max-w-xl sm:-mt-24 lg:absolute lg:bottom-0 lg:left-[22%] lg:mt-0 lg:w-[45%] lg:max-w-none">
          <Image
            src={`${BF_IMG}/hero-product-shelf.png`}
            alt="Dermisque 3X serums lined up on a shelf"
            width={640}
            height={256}
            priority
            className="bf-float h-auto w-full drop-shadow-[0_24px_30px_rgba(74,22,6,0.25)]"
          />
        </div>
      </div>

      <div className="bg-ink text-white">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-center gap-1 px-4 py-4 text-center sm:flex-row sm:gap-4">
          <p className="font-display text-lg sm:text-xl">
            {data.live ? `The Black Friday edit is live — until ${ukDay(data.endsAt)}` : `The Black Friday edit arrives ${ukDay(data.startsAt)}`}
          </p>
          <p className="text-xs text-white/70">Every serum, plus combos and giftable sets.</p>
        </div>
      </div>
    </section>
  );
}
