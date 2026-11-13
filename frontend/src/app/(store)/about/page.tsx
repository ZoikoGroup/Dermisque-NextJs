import Image from "next/image";
import { ArrowRight, BadgeCheck, FlaskConical, HeartHandshake, Rabbit } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/misc";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { site } from "@/lib/site";

export const metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <>
      <section className="container-luxe grid items-center gap-12 py-16 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow">About Dermisque</p>
          <h1 className="mt-3 font-display text-5xl leading-tight sm:text-6xl">
            The <span className="text-brand">sum</span> of beauty.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">
            The Σ in our name is the mathematical symbol for a sum. It describes how we formulate: every
            Dermisque serum brings together three complementary actives, so they work better together than
            any one of them alone.
          </p>
          <p className="mt-4 leading-relaxed text-ink-soft">
            From Niacinamide and Tranexamic Acid to Redensyl and liposomal Glutathione, we pick proven
            ingredients and pair them with hydration and antioxidant support. The result is focused serums
            for real concerns, from dull skin and dark spots to dark circles and hair loss.
          </p>
          <p className="mt-4 text-sm text-mute">
            {site.wordmark} is a trading name of {site.company}, with offices in the United States and United Kingdom.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="relative grid grid-cols-2 gap-4">
            <div className="animate-float overflow-hidden rounded-[2rem]">
              <Image src="/products/skin-brightening.webp" alt="" width={500} height={500} />
            </div>
            <div className="mt-16 animate-float overflow-hidden rounded-[2rem] [animation-delay:-3s]">
              <Image src="/products/dark-spot.webp" alt="" width={500} height={500} />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="bg-white py-24">
        <div className="container-luxe">
          <SectionHeading center eyebrow="What we stand for" title="Made with care, held to standard" />
          <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: FlaskConical, t: "Purposeful formulas", d: "Three actives per serum, each with a clear job." },
              { icon: BadgeCheck, t: "Certified quality", d: "Made in ISO 9001:2015 & GMP certified facilities." },
              { icon: Rabbit, t: "Cruelty-free", d: "Never tested on animals." },
              { icon: HeartHandshake, t: "Expert guidance", d: "Free consultations to find your right routine." },
            ].map(({ icon: Icon, t, d }) => (
              <StaggerItem key={t}>
                <div className="ring-brand group h-full rounded-3xl bg-cream p-7 transition-all duration-500 hover:-translate-y-2">
                  <span className="grid size-12 place-items-center rounded-2xl bg-white transition duration-500 group-hover:rotate-6 group-hover:bg-brand">
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-6 font-display text-xl">{t}</p>
                  <p className="mt-2 text-sm text-ink-soft">{d}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="container-luxe py-24 text-center">
        <Reveal>
          <h2 className="font-display text-4xl sm:text-5xl">Find the serum that&apos;s right for you</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/shop" size="lg">Shop all serums <ArrowRight className="size-4" /></ButtonLink>
            <ButtonLink href="/consultation" size="lg" variant="outline">Free consultation</ButtonLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
