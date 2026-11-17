import Link from "next/link";
import { ArrowRight, FlaskConical, Globe2, HeartHandshake, Leaf, Mail } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { site } from "@/lib/site";

export const metadata = {
  title: "Careers",
  description: "Work with Dermisque: help us redefine beauty with science-led, cruelty-free skincare.",
};

const W = site.wordmark;

const WHY = [
  { icon: FlaskConical, title: "Science-led", text: "Work on triple-action formulas built around proven, well-researched actives." },
  { icon: Leaf, title: "Responsible beauty", text: "Cruelty-free, vegan-friendly and committed to more sustainable choices." },
  { icon: Globe2, title: "International team", text: "Collaborate across our offices in the USA and the United Kingdom." },
  { icon: HeartHandshake, title: "Customer first", text: "Everything we do starts with helping people feel confident in their skin." },
];

const AREAS = ["Customer care", "E-commerce & marketing", "Product & formulation", "Operations & logistics", "Retail & distribution"];

export default function CareersPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(120deg,#f6ece0_0%,#efe0cc_50%,#e9eadb_100%)]">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-[420px] rounded-full bg-[#9db27a]/35 blur-[90px]" />
        <Reveal className="container-luxe relative max-w-3xl py-16 sm:py-20">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#1f7a6e]">Careers</p>
          <h1 className="mt-3 font-display text-5xl leading-tight text-[#0f3d35] sm:text-6xl">Grow with {W}</h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            We&apos;re building a skincare brand where science meets the sum of beauty. If you care about quality, honesty
            and making people feel their best, we&apos;d love to hear from you.
          </p>
        </Reveal>
      </section>

      <section className="container-luxe py-16">
        <Reveal>
          <h2 className="font-display text-4xl">Why work with us</h2>
        </Reveal>
        <Stagger className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map(({ icon: Icon, title, text }) => (
            <StaggerItem key={title}>
              <div className="h-full rounded-3xl border border-line bg-white p-6">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#e3efe9] text-[#0f3d35]">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-2xl text-[#0f3d35]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="bg-white py-16">
        <div className="container-luxe grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-4xl">Open positions</h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              There are no open roles listed right now. We&apos;re always happy to receive speculative applications,
              especially in these areas:
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <li key={a} className="rounded-full border border-line bg-cream px-4 py-1.5 text-sm">
                  {a}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-3xl bg-[#0f3d35] p-8 text-white">
              <Mail className="size-6 text-[#d9b46a]" />
              <p className="mt-4 font-display text-2xl">Send us your CV</p>
              <p className="mt-2 leading-relaxed text-white/75">
                Email your CV and a short note about the kind of role you&apos;re looking for. We&apos;ll keep it on file
                and get in touch when something suitable opens up.
              </p>
              <a
                href={`mailto:${site.email}?subject=${encodeURIComponent("Careers enquiry")}`}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#0f3d35] transition hover:bg-[#f3e6d0]"
              >
                {site.email} <ArrowRight className="size-4" />
              </a>
              <p className="mt-4 text-sm text-white/60">
                Prefer a form? Use our{" "}
                <Link href="/contact" className="underline underline-offset-2 hover:text-white">
                  contact page
                </Link>
                .
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
