import Image from "next/image";
import { ArrowRight, Gem, Leaf, Rabbit, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { site } from "@/lib/site";

export const metadata = {
  title: "About Us",
  description:
    "Dermisque — Sum of Beauty. Our mission, our values of sustainability, cruelty-free practice and high-quality ingredients, and the journey behind our serums.",
};

const W = site.wordmark; // DΣRMISQUΣ

const VALUES = [
  {
    icon: Leaf,
    title: "Sustainability",
    text: "We hold the planet close to our hearts. That's why we are dedicated to sustainability in every aspect of our business. From responsibly sourced ingredients to eco-friendly packaging, we strive to minimise our environmental footprint and make choices that benefit our planet for generations to come.",
  },
  {
    icon: Rabbit,
    title: "Cruelty-free practices",
    text: "We stand firmly against animal testing. None of our products are ever tested on animals, and we work exclusively with suppliers who share our commitment to cruelty-free practices. Our goal is to create beauty without harm.",
  },
  {
    icon: Gem,
    title: "High-quality ingredients",
    text: "We believe that quality is the foundation of excellence. That's why we meticulously select high-quality ingredients known for their efficacy and safety. We are committed to providing you with skincare products that deliver outstanding results, time and time again.",
  },
];

const BADGES = [
  { file: "silicone-free", label: "Silicone free" },
  { file: "cruelty-free", label: "Cruelty free" },
  { file: "eco-friendly", label: "Eco friendly" },
  { file: "international-certifications", label: "International certifications" },
  { file: "no-harsh-chemicals", label: "No harsh chemicals" },
  { file: "sulfate-free", label: "Sulfate free" },
  { file: "vegan", label: "Vegan" },
];

const JOURNEY = [
  {
    step: "Inception",
    text: `Our journey began with a dream — a dream to redefine beauty, to elevate it beyond the surface, and to empower individuals to embrace their unique radiance. With this vision in our hearts, ${W} was born.`,
  },
  {
    step: "Evolution",
    text: "Over the years, we have evolved, nurtured by the wisdom of time and the aspirations of our customers. We embarked on a relentless quest for excellence, curating and creating skincare products that transcend the ordinary. Our commitment to high-quality ingredients, cruelty-free practices, and sustainability became the pillars of our identity.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#fdeee2_0%,#fbe0c8_55%,#f7cfa4_100%)]">
        <div className="pointer-events-none absolute -left-24 top-10 size-96 rounded-full bg-white/50 blur-3xl" />
        <div className="container-luxe relative grid items-center gap-10 py-16 lg:grid-cols-[1fr_1.05fr] lg:py-24">
          <Reveal className="order-2 lg:order-1">
            <div className="mx-auto max-w-xl animate-float overflow-hidden rounded-[2.5rem] bg-white shadow-[0_30px_70px_-35px_rgba(150,80,20,0.45)]">
              <Image
                src="/about/serum-in-hand.png"
                alt="A hand holding the Dermisque 3X Skin Hydrating Face Serum"
                width={2048}
                height={1220}
                priority
                sizes="(min-width:1024px) 560px, 92vw"
                className="h-auto w-full"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="order-1 lg:order-2">
            <p className="eyebrow">About us</p>
            <h1 className="sr-only">About Dermisque — Sum of Beauty</h1>
            <Image src="/logo.png" alt="" width={1128} height={236} priority className="mt-5 h-auto w-full max-w-md" />
            <p className="mt-8 text-lg leading-relaxed text-ink-soft">
              We believe that beauty is not just a surface attribute but a transformative journey — one that empowers you
              to be your most confident and radiant self. Our commitment to excellence is reflected in every product we
              curate and create, ensuring that each one becomes a masterpiece in your skincare ritual.
            </p>
            <p className="mt-6 font-display text-2xl sm:text-3xl">Join us in the pursuit of timeless beauty.</p>
          </Reveal>
        </div>
      </section>

      {/* mission */}
      <section className="container-luxe py-20 text-center sm:py-24">
        <Reveal className="mx-auto max-w-3xl">
          <p className="eyebrow">Our mission &amp; values</p>
          <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">More than just skincare</h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">
            At {W}, we are dedicated to more than just skincare; we are committed to enhancing your beauty and elevating
            your self-confidence. Our mission is born from a deep understanding of the profound connection between beauty
            and empowerment.
          </p>
        </Reveal>
      </section>

      {/* values */}
      <section className="bg-white py-20 sm:py-24">
        <div className="container-luxe">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">What we stand for</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">Our values</h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              At {W}, our values are the cornerstone of everything we do. They shape our identity, guide our decisions,
              and define our commitment to you, our cherished customer.
            </p>
          </Reveal>
          <Stagger className="mt-12 grid gap-5 lg:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <StaggerItem key={title}>
                <article className="ring-brand group h-full rounded-3xl bg-cream p-7 transition-all duration-500 hover:-translate-y-2">
                  <span className="grid size-12 place-items-center rounded-2xl bg-white transition duration-500 group-hover:rotate-6 group-hover:bg-brand">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-6 font-display text-2xl">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{text}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal>
            <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-ink p-7 text-white sm:flex-row sm:items-center sm:p-9">
              <Sparkles className="size-7 shrink-0 text-sun" />
              <p className="leading-relaxed text-white/80">
                <span className="font-semibold text-white">Our values are not just words:</span> they are the essence of{" "}
                {W}. When you choose our products, you choose skincare that aligns with your values — a choice that
                reflects your commitment to a more beautiful and compassionate world.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* promise badges */}
      <section className="bg-[#f9b46f] py-14 sm:py-16">
        <div className="container-luxe">
          <h2 className="sr-only">Our product promises</h2>
          <Stagger className="grid grid-cols-3 justify-items-center gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-7">
            {BADGES.map((b) => (
              <StaggerItem key={b.file}>
                <figure className="group flex flex-col items-center">
                  <Image
                    src={`/about/badge-${b.file}.png`}
                    alt={b.label}
                    width={520}
                    height={520}
                    sizes="(min-width:1024px) 130px, 100px"
                    className="size-24 drop-shadow-[0_6px_14px_rgba(122,62,0,0.25)] transition duration-500 group-hover:-translate-y-1.5 group-hover:rotate-[-6deg] sm:size-28 lg:size-32"
                  />
                  <figcaption className="sr-only">{b.label}</figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* journey */}
      <section id="our-story" className="scroll-mt-28 container-luxe grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <div className="relative grid grid-cols-2 gap-4">
            {[
              { src: "/products/skin-hydrating.png", alt: "3X Skin Hydrating Face Serum", cls: "" },
              { src: "/products/vitamin-c.webp", alt: "3X Vitamin C Face Serum", cls: "mt-16 [animation-delay:-3s]" },
            ].map((im) => (
              <div key={im.src} className={`relative aspect-[4/5] animate-float overflow-hidden rounded-[2rem] bg-white ${im.cls}`}>
                <Image src={im.src} alt={im.alt} fill sizes="(min-width:1024px) 260px, 45vw" className="object-cover" />
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="eyebrow">Our story</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl">Our journey</h2>
          <p className="mt-5 leading-relaxed text-ink-soft">
            At {W}, our story is a tapestry woven with a passion for beauty, a commitment to excellence, and a vision for
            a more radiant future.
          </p>
          <ol className="mt-8 space-y-6 border-l-2 border-sun/40 pl-6">
            {JOURNEY.map((j) => (
              <li key={j.step} className="relative">
                <span className="absolute -left-[1.95rem] top-1.5 size-3.5 rounded-full border-2 border-white bg-sun shadow" />
                <h3 className="font-display text-2xl">{j.step}</h3>
                <p className="mt-1 leading-relaxed text-ink-soft">{j.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {/* commitment */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#ee8a35_0%,#d4661c_100%)] py-20 text-center text-white sm:py-24">
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-80 rounded-full bg-white/10 blur-2xl" />
        <Reveal className="container-luxe relative mx-auto max-w-4xl">
          <h2 className="font-display text-4xl sm:text-5xl">Our commitment</h2>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/85">A vision for the future</p>
          <p className="mt-6 text-lg leading-relaxed">
            As we look ahead, our vision remains clear — to continue redefining beauty, empowering self-confidence, and
            leaving a positive impact on the world. We envision a future where beauty is not just a reflection in the
            mirror but a journey of self-discovery, self-expression, and self-love. Our story is not just about the past
            or the present; it&apos;s about the radiant future we are collectively creating. We invite you to be a part of
            this journey, to embrace the beauty within and the beauty around, and to elevate your life with {W}.
          </p>
        </Reveal>
      </section>

      {/* call to action */}
      <section className="container-luxe py-20 text-center sm:py-24">
        <Reveal>
          <h2 className="font-display text-4xl sm:text-5xl">Find the serum that&apos;s right for you</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/shop" size="lg">
              Shop all serums <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="/consultation" size="lg" variant="outline">
              Free consultation
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
