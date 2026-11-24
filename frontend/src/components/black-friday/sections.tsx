import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { BF_IMG, ukDate, ukDay, type BlackFriday } from "@/lib/black-friday";
import { site } from "@/lib/site";
import { FreeShippingText } from "@/components/store/currency-provider";
import { CountdownBoxes } from "./countdown";

/* ───────────── Build your ritual bundle ───────────── */
export function RitualBundle({ data }: { data: BlackFriday }) {
  return (
    <section className="px-4 py-10 sm:py-14">
      <Reveal className="mx-auto grid max-w-6xl items-center gap-8 overflow-hidden rounded-md bg-[linear-gradient(120deg,#f3e3c4_0%,#e9d3a9_100%)] p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#7a5a2b]">Black Friday bundles</p>
          <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Build your ritual bundle.</h2>
          <p className="mt-3 max-w-sm text-sm text-ink-soft">
            Choose specially selected serums and make them a set for yourself or as a gift.
          </p>
          <p className="mt-5 font-display text-2xl text-ink-soft">
            {data.live ? (
              <>
                Bundles now <span className="text-[#e07b12]">{data.comboPct}% off</span>
              </>
            ) : (
              <>
                Bundle savings revealed <span className="text-[#e07b12]">{ukDay(data.startsAt)}</span>
              </>
            )}
          </p>
          <a
            href="#combos"
            className="sheen mt-6 inline-flex rounded-[3px] bg-ink px-6 py-3 text-[0.66rem] font-bold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Shop bundles
          </a>
        </div>
        <div className="group overflow-hidden rounded-sm">
          <Image
            src={`${BF_IMG}/ritual-bundle-trio.png`}
            alt="Dark Spot Corrector, Aloe Glow and Skin Brightening serums styled as a set"
            width={695}
            height={335}
            sizes="(min-width:1024px) 640px, 92vw"
            className="h-auto w-full transition duration-1000 ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
          />
        </div>
      </Reveal>
    </section>
  );
}

/* ───────────── The Dermisque ritual ───────────── */
const STEPS = [
  { title: "Discover", text: "Choose the serum that fits your routine." },
  { title: "Layer", text: "Make it part of an elegant everyday ritual." },
  { title: "Gift", text: "Share the ritual with a giftable set." },
];

export function RitualSteps() {
  return (
    <section className="px-4 py-10 sm:py-14">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-md lg:grid-cols-2">
        <div className="flex flex-col justify-center bg-[#2f7c80] p-8 text-white sm:p-12">
          <Reveal>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-white/70">The Dermisque ritual</p>
            <h2 className="mt-3 font-display text-4xl leading-tight">Science. Radiance. Renewal.</h2>
          </Reveal>
          <Stagger className="mt-8 space-y-5">
            {STEPS.map((s, i) => (
              <StaggerItem key={s.title} className="flex items-start gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold text-[#2f7c80]">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-white/75">{s.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <a
            href="#singles"
            className="mt-9 block rounded-[3px] bg-white py-3.5 text-center text-[0.66rem] font-bold uppercase tracking-[0.22em] text-[#2f7c80] transition hover:bg-[#f4efe7]"
          >
            Shop the edit
          </a>
          <p className="mt-4 text-[0.7rem] text-white/60">
            Cosmetic serums for everyday skincare. Patch-test before first use.
          </p>
        </div>
        <div className="group relative min-h-80 overflow-hidden bg-[#ece7df]">
          <Image
            src={`${BF_IMG}/ritual-flatlay.png`}
            alt="Flat lay of Dermisque serums with a jade facial roller"
            fill
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover transition duration-[1.4s] ease-[var(--ease-luxe)] group-hover:scale-[1.05]"
          />
        </div>
      </div>
    </section>
  );
}

/* ───────────── Shop by skin type ───────────── */
const SKIN_TYPES = [
  { label: "Oily-looking skin", text: "A lightweight routine", img: "oily-skin", href: "/shop?concern=acne" },
  { label: "Dry-feeling skin", text: "A comforting routine", img: "dry-skin", href: "/shop?concern=dryness" },
  { label: "Sensitive skin", text: "A gentle routine", img: "sensitive-skin", href: "/consultation" },
  { label: "Radiance", text: "A glow-focused ritual", img: "radiance", href: "/shop?concern=dull-skin" },
];

export function SkinTypes() {
  return (
    <section className="px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl">Shop by Skin Type</h2>
          <p className="mt-2 text-sm text-mute">Find your place to start.</p>
        </Reveal>
        <Stagger className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {SKIN_TYPES.map((s) => (
            <StaggerItem key={s.img}>
              <Link href={s.href} className="group relative block aspect-[279/372] overflow-hidden rounded-xl">
                <Image
                  src={`${BF_IMG}/skin-types/${s.img}.png`}
                  alt=""
                  fill
                  sizes="(min-width:768px) 240px, 45vw"
                  className="object-cover transition duration-1000 ease-[var(--ease-luxe)] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent transition group-hover:from-black/85" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-center text-white">
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] sm:text-xs">{s.label}</p>
                  <p className="mt-1 text-[0.68rem] text-white/75">{s.text}</p>
                  <span className="mx-auto mt-2 flex w-fit items-center gap-1 text-[0.62rem] font-semibold uppercase tracking-widest text-[#ffc56b] opacity-0 transition duration-500 group-hover:opacity-100">
                    Explore <ArrowUpRight className="size-3" />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────────── Countdown ───────────── */
export function CountdownSection({ data }: { data: BlackFriday }) {
  return (
    <section className="relative overflow-hidden bg-[#0b0b0f] px-4 py-16 text-white sm:py-20">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[44rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#b5560a]/40 blur-[90px]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl sm:text-5xl">Black Friday to Cyber Monday</h2>
        <p className="mt-3 text-sm text-white/70">
          {data.live ? `Live now · ends ${ukDate(data.endsAt)}, 23:59 UK time` : `Starts ${ukDate(data.startsAt)}`}
        </p>
        <CountdownBoxes startsAt={data.startsAt} endsAt={data.endsAt} className="mx-auto mt-8 max-w-xl" />
        <p className="mt-6 text-[0.72rem] text-white/50">
          {data.live ? "Counting down to the end of the sale" : "Counting down to the start of the sale"} (UK time).
        </p>
      </div>
    </section>
  );
}

/* ───────────── Offer terms ───────────── */
export function OfferTerms({ data }: { data: BlackFriday }) {
  const rows: [string, React.ReactNode][] = [
    ["Offer dates", `${ukDay(data.startsAt)} – ${ukDate(data.endsAt)}. The sale ends at 23:59 UK time on Cyber Monday.`],
    ["Prices", "Shown in your selected currency and include taxes. The price in your basket is the price you pay."],
    [
      "Savings",
      `${data.singlePct}% off each serum's regular selling price; ${data.comboPct}% off the combined regular price of each combo and gift set.`,
    ],
    ["Eligible products", "Every Dermisque serum, plus the combos and gift sets on this page, while stock lasts."],
    [
      "Discount codes",
      "Codes such as NEW30 can't be combined with Black Friday prices — the sale saving is already bigger.",
    ],
    [
      "Delivery",
      <>
        <FreeShippingText template="Free shipping on orders over {amount}" />, otherwise a flat rate. Delivery usually takes 2–7 days after dispatch.
      </>,
    ],
    [
      "Returns",
      <>
        Damaged or incorrect items are replaced free within 7 days of delivery.{" "}
        <Link href="/policies/replacement" className="underline underline-offset-2 hover:text-ink">
          Replacement policy
        </Link>
      </>,
    ],
  ];
  const faqs = [
    {
      q: "What if a product sells out?",
      a: "Sale items are limited to available stock. If a serum sells out, combos and gift sets that include it are paused too. Items already in a placed order are reserved for you.",
    },
    {
      q: "Are Dermisque serums medicines?",
      a: "No. Dermisque serums are cosmetic skincare and hair care products. They are not intended to diagnose, treat, cure or prevent any disease. If you have a skin condition, are pregnant or notice irritation, please check with your doctor first.",
    },
    {
      q: "Can I use a discount code as well?",
      a: "Not during Black Friday. Sale prices already include the larger saving, so codes can't be added on top.",
    },
    {
      q: "Can I send a gift set straight to someone?",
      a: "Yes. Enter the recipient's address at checkout and add a note for our team in the order notes.",
    },
  ];

  return (
    <section className="px-4 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <Reveal>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#b8862f]">Offer terms</p>
          <h2 className="mt-3 font-display text-4xl leading-tight">Clear terms, before you buy.</h2>
          <p className="mt-3 text-sm text-mute">Every condition of the Black Friday offer.</p>
          <p className="mt-6 text-xs text-mute">
            Questions? Email{" "}
            <a href={`mailto:${site.email}`} className="underline underline-offset-2">
              {site.email}
            </a>
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <dl className="border-t-2 border-ink">
            {rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="text-[0.62rem] font-bold uppercase tracking-[0.18em]">{k}</dt>
                <dd className="text-sm text-ink-soft">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6">
            {faqs.map((f) => (
              <details key={f.q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lg [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Plus className="size-4 shrink-0 text-[#e07b12] transition duration-300 group-open:rotate-45" />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
