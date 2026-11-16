import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Droplets,
  FlaskConical,
  Leaf,
  Rabbit,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Truck,
} from "lucide-react";
import { Hero } from "@/components/home/hero";
import { FreeShippingText } from "@/components/store/currency-provider";
import { CopyCode } from "@/components/home/copy-code";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/misc";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { BlogCard } from "@/components/blog/blog-card";
import { getBlogPosts } from "@/lib/blog";
import { getBlackFriday, getCategories, getFeaturedProducts } from "@/lib/queries";
import { BlackFridayPopup } from "@/components/black-friday/popup";

const concernImages: Record<string, string> = {
  "dull-skin": "/products/vitamin-c.webp",
  wrinkles: "/products/anti-aging.webp",
  acne: "/products/skin-exfoliating.jpg",
  dryness: "/products/skin-hydrating.png",
  "dark-spots": "/products/dark-spot.webp",
  "sun-damage": "/products/gluta-glow.webp",
  "dark-circles": "/products/under-eye.jpg",
  "hair-loss": "/products/hair-growth.webp",
  pigmentation: "/products/skin-brightening.webp",
};

const trust = [
  { icon: Rabbit, label: "Cruelty-free" },
  { icon: BadgeCheck, label: "ISO 9001:2015" },
  { icon: ShieldCheck, label: "GMP certified" },
  { icon: Truck, label: "Free shipping over {amount}" },
  { icon: Sparkles, label: "All skin types" },
];

export default async function HomePage() {
  const [featured, categories, journal, blackFriday] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
    getBlogPosts({ pageSize: 3 }).catch(() => null),
    getBlackFriday().catch(() => null),
  ]);

  return (
    <>
      {blackFriday && (
        <BlackFridayPopup
          campaign={{
            live: blackFriday.live,
            startsAt: blackFriday.startsAt,
            endsAt: blackFriday.endsAt,
            singlePct: blackFriday.singlePct,
            comboPct: blackFriday.comboPct,
          }}
        />
      )}
      <Hero />

      {/* Trust strip */}
      <section className="border-y border-line bg-white">
        <div className="container-luxe flex flex-wrap items-center justify-center gap-x-10 gap-y-4 py-6 sm:justify-between">
          {trust.map(({ icon: Icon, label }) => (
            <div key={label} className="group flex items-center gap-2.5 text-sm text-ink-soft">
              <span className="grid size-9 place-items-center rounded-full bg-cream transition-all duration-500 group-hover:rotate-[360deg] group-hover:bg-brand group-hover:text-ink">
                <Icon className="size-4" />
              </span>
              {label.includes("{amount}") ? <FreeShippingText template={label} /> : label}
            </div>
          ))}
        </div>
      </section>

      {/* Shop by concern */}
      <section id="concern" className="container-luxe py-24">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <Reveal>
            <SectionHeading
              eyebrow="Shop by concern"
              title={
                <>
                  What does your skin <em className="text-brand not-italic">need</em> today?
                </>
              }
              sub="Every formula targets a specific concern with three complementary actives."
            />
          </Reveal>
          <Reveal delay={0.1}>
            <ButtonLink href="/shop" variant="outline">
              View all products <ArrowRight className="size-4" />
            </ButtonLink>
          </Reveal>
        </div>

        <Stagger className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.slice(0, 9).map((c, i) => (
            <StaggerItem key={c.slug} className={i === 0 ? "col-span-2 row-span-2 lg:col-span-2" : ""}>
              <Link
                href={`/shop?concern=${c.slug}`}
                className="group relative block h-full min-h-48 overflow-hidden rounded-[1.75rem] bg-sand"
              >
                <Image
                  src={concernImages[c.slug] ?? "/products/vitamin-c.webp"}
                  alt=""
                  fill
                  sizes={i === 0 ? "(min-width:1024px) 40vw, 100vw" : "(min-width:1024px) 20vw, 50vw"}
                  className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-luxe)] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent transition-opacity duration-500 group-hover:from-ink/90" />
                <div className="absolute inset-0 bg-brand opacity-0 mix-blend-soft-light transition-opacity duration-700 group-hover:opacity-60" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-5 text-white">
                  <div>
                    <p className={i === 0 ? "font-display text-3xl sm:text-4xl" : "font-display text-xl"}>{c.name}</p>
                    <p className="mt-1 text-xs text-white/70">
                      {c.productCount} {c.productCount === 1 ? "serum" : "serums"}
                    </p>
                  </div>
                  <span className="grid size-10 shrink-0 translate-y-3 place-items-center rounded-full bg-white text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}

          {/* fills the remaining cells of the last row */}
          <StaggerItem className="col-span-2 md:col-span-3 lg:col-span-3">
            <Link
              href="/consultation"
              className="group relative flex h-full min-h-48 flex-col justify-between gap-6 overflow-hidden rounded-[1.75rem] bg-ink p-7 text-white sm:flex-row sm:items-end sm:p-9"
            >
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute -right-16 -top-24 size-72 rounded-full bg-sun/50 blur-[90px] transition-transform duration-1000 group-hover:-translate-x-10 group-hover:translate-y-6" />
                <div className="absolute -bottom-28 left-1/3 size-72 rounded-full bg-aqua/40 blur-[90px] transition-transform duration-1000 group-hover:translate-x-10" />
                <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:20px_20px]" />
                <span className="absolute -right-4 -top-10 select-none font-display text-[11rem] leading-none text-white/[0.06] transition-transform duration-700 group-hover:rotate-12">
                  Σ
                </span>
              </div>
              <div className="relative max-w-md">
                <p className="text-[0.7rem] uppercase tracking-[0.25em] text-white/60">Not sure where to start?</p>
                <p className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
                  Get a <span className="text-brand italic">free</span> skin consultation
                </p>
                <p className="mt-3 text-sm text-white/70">
                  Tell us about your skin and we&apos;ll build a 3X routine that fits it.
                </p>
              </div>
              <span className="relative inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-5 py-3 text-sm font-medium text-ink transition-all duration-500 group-hover:gap-3 group-hover:bg-brand group-hover:text-white sm:self-auto">
                Book now <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:rotate-45" />
              </span>
            </Link>
          </StaggerItem>
        </Stagger>
      </section>

      {/* Bestsellers */}
      <section className="bg-white py-24">
        <div className="container-luxe">
          <Reveal>
            <SectionHeading
              center
              eyebrow="Bestsellers"
              title="Loved by skin, backed by science"
              sub="Our most-reached-for serums — triple-action formulas for visible results."
            />
          </Reveal>
          <Stagger className="mt-14 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {featured.map((p, i) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} priority={i < 4} />
              </StaggerItem>
            ))}
          </Stagger>
          <div className="mt-12 text-center">
            <ButtonLink href="/shop" size="lg">
              Explore the full collection <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* The 3X science */}
      <section className="relative overflow-hidden bg-ink py-28 text-white">
        <div aria-hidden className="absolute -left-40 top-0 size-[500px] rounded-full bg-sun/20 blur-[140px]" />
        <div aria-hidden className="absolute -right-40 bottom-0 size-[500px] rounded-full bg-aqua/20 blur-[140px]" />
        <div className="container-luxe relative grid items-center gap-16 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow !text-white/50">The 3X formula</p>
            <h2 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">
              Three actives.
              <br />
              <span className="text-brand animate-gradient">One sum of beauty.</span>
            </h2>
            <p className="mt-6 max-w-lg text-white/70">
              The Σ in our name is the symbol for a sum. Each Dermisque serum adds three complementary
              ingredients, so the result is greater than any one of them alone.
            </p>
            <ButtonLink href="/about" variant="brand" size="lg" className="mt-10">
              Our philosophy <ArrowRight className="size-4" />
            </ButtonLink>
          </Reveal>

          <Stagger className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              { icon: FlaskConical, n: "01", t: "Targeted actives", d: "Clinically known ingredients like Niacinamide 10%, Retinol and Redensyl." },
              { icon: Droplets, n: "02", t: "Hydration support", d: "Hyaluronic acid and botanicals cushion every formula." },
              { icon: SunMedium, n: "03", t: "Antioxidant defence", d: "Vitamin C, E and Glutathione protect against daily stress." },
            ].map(({ icon: Icon, n, t, d }) => (
              <StaggerItem key={n}>
                <div className="group h-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all duration-500 hover:-translate-y-2 hover:border-white/30 hover:bg-white/10">
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-brand text-ink transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-display text-3xl text-white/20">{n}</span>
                  </div>
                  <p className="mt-6 font-display text-xl">{t}</p>
                  <p className="mt-2 text-sm text-white/60">{d}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Spotlight */}
      <section className="container-luxe grid items-center gap-12 py-28 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="group relative aspect-square overflow-hidden rounded-[2.5rem]">
            <Image
              src="/products/gold-serum.jpg"
              alt="Dermisque 24 KT Gold Serum"
              fill
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-[2s] ease-[var(--ease-luxe)] group-hover:scale-105"
            />
          </div>
          <div className="absolute -bottom-6 -right-2 rounded-3xl bg-white p-5 shadow-2xl sm:right-6">
            <p className="eyebrow">Key actives</p>
            <p className="mt-1 font-display text-lg">24 KT Gold · Niacinamide 10% · Hyaluronic Acid</p>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="eyebrow">Spotlight</p>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            24 KT Gold Serum — <em className="text-brand">liquid radiance</em>
          </h2>
          <p className="mt-6 text-ink-soft">
            A luxurious serum with real 24 KT gold dust, Niacinamide 10% and Hyaluronic Acid that
            brightens the skin, helps fight acne and evens out skin tone for a golden glow.
          </p>
          <ul className="mt-8 space-y-3">
            {["Brightens up the skin", "Fights acne", "Evens the skin tone"].map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-brand">
                  <Leaf className="size-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/product/24kt-gold-serum" size="lg">
              Shop 24 KT Gold — $55
            </ButtonLink>
          </div>
        </Reveal>
      </section>

      {/* Ritual */}
      <section className="bg-brand-soft py-24">
        <div className="container-luxe">
          <Reveal>
            <SectionHeading center eyebrow="Your ritual" title="Three steps to visible results" />
          </Reveal>
          <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { n: "1", t: "Cleanse", d: "Start with clean, dry skin so actives can absorb properly." },
              { n: "2", t: "Treat", d: "Pat 2–3 drops of your Dermisque serum over face and neck." },
              { n: "3", t: "Protect", d: "Seal with moisturiser and finish with SPF every morning." },
            ].map((s) => (
              <StaggerItem key={s.n}>
                <div className="ring-brand group relative h-full rounded-[2rem] bg-white p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                  <span className="font-display text-7xl leading-none text-line transition-colors duration-500 group-hover:text-amber">
                    {s.n}
                  </span>
                  <p className="mt-4 font-display text-2xl">{s.t}</p>
                  <p className="mt-2 text-ink-soft">{s.d}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Offer */}
      <section className="container-luxe py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-ink p-10 text-white sm:p-16">
            <div aria-hidden className="absolute inset-0 bg-brand opacity-90 animate-gradient bg-[length:200%_200%]" />
            <div aria-hidden className="absolute -right-10 -top-10 font-display text-[18rem] leading-none text-white/20">
              Σ
            </div>
            <div className="relative grid items-center gap-10 text-ink md:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="eyebrow !text-ink/60">Welcome offer</p>
                <h2 className="mt-3 font-display text-4xl sm:text-6xl">30% off your first order</h2>
                <p className="mt-4 max-w-md text-ink/75">
                  New to Dermisque? Use code NEW30 at checkout. Coming back? DERMISQUE gives you 25% off
                  your second order.
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <CopyCode code="NEW30" />
                <CopyCode code="DERMISQUE" />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Journal */}
      {journal && journal.items.length > 0 && (
        <section className="container-luxe pb-24">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <Reveal>
              <SectionHeading
                eyebrow="From the journal"
                title="Skincare, explained"
                sub="Ingredient guides, routines and expert tips from the Dermisque team."
              />
            </Reveal>
            <Reveal delay={0.1}>
              <ButtonLink href="/blog" variant="outline">
                Read the journal <ArrowRight className="size-4" />
              </ButtonLink>
            </Reveal>
          </div>
          <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {journal.items.map((p) => (
              <StaggerItem key={p.id}>
                <BlogCard post={p} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {/* Consultation CTA */}
      <section className="container-luxe">
        <Reveal>
          <div className="grid items-center gap-8 rounded-[2.5rem] border border-line bg-white p-10 sm:p-14 md:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow">Not sure where to start?</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">Get a free skin consultation</h2>
              <p className="mt-3 max-w-xl text-ink-soft">
                Tell us about your skin and our experts will recommend the right serum routine — free,
                no obligation.
              </p>
            </div>
            <ButtonLink href="/consultation" size="lg" variant="brand">
              Book free consultation <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
