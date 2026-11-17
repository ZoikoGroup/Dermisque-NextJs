import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { concerns, site } from "@/lib/site";
import { CONSULT, LOWER, SHOP, type LinkItem } from "@/lib/site-links";
import { ChatLink, FooterCurrency } from "./footer-extras";
import { NewsletterForm } from "./newsletter-form";

const GOLD = "text-[#d9b46a]";
const heading = cn("text-[0.95rem] font-semibold uppercase tracking-wide", GOLD);
const linkCls = "text-white/85 transition-colors hover:text-[#d9b46a]";

const CONCERN_COLS = [concerns.slice(0, 5), concerns.slice(5)];

const OFFICES = [
  { title: "U.S. Headquarters", lines: site.addresses[0].lines, phone: "+1-800-484-5574" },
  { title: "Florida Office", lines: site.addresses[1].lines, phone: "+1-800-699-4917" },
  { title: "UK / Europe Office", lines: [...site.addresses[2].lines.slice(0, 1), `${site.addresses[2].lines[1]}, UK`], phone: "+44 330 088 8958" },
];

const tel = (p: string) => `tel:${p.replace(/[^+\d]/g, "")}`;

function FooterLink({ l }: { l: LinkItem }) {
  return l.chat ? (
    <ChatLink href={l.href} className={linkCls}>
      {l.label}
    </ChatLink>
  ) : (
    <Link href={l.href} className={linkCls}>
      {l.label}
    </Link>
  );
}

function Col({ title, links, className }: { title: string; links: LinkItem[]; className?: string }) {
  return (
    <div className={className}>
      <p className={heading}>{title}</p>
      <ul className="mt-5 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <FooterLink l={l} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Vertical gold rule between columns on large screens. */
const rule = "lg:border-l lg:border-[#b8955a]/30 lg:pl-8";

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-[#0d2925] text-white">
      <div className="h-[3px] bg-[linear-gradient(90deg,#b8955a,#1f7a6e_55%,#9fd3cb)]" />
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-[#1f7a6e] opacity-20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[112rem] px-4 sm:px-6 lg:px-10 2xl:px-[4.5rem]">
        {/* shop, concerns and advice */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 lg:grid-cols-[1.35fr_1fr_1fr_1fr_1.35fr] lg:gap-8">
          <div className="col-span-2 lg:col-span-1 lg:pr-4">
            <Logo light className="w-52" />
            <p className="mt-5 font-display text-xl italic xl:text-[1.35rem]">Science of skin. Sum of beauty.</p>
            <span className="mt-3 block h-[2px] w-12 bg-[#d9b46a]" />
            <p className="mt-4 max-w-xs leading-relaxed text-white/80">
              Premium 3X skin and hair serums. Thoughtfully formulated beauty for skin and hair care.
            </p>
            <p className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide">Join the Dermisque circle</p>
            <NewsletterForm />
          </div>

          <Col title={SHOP.title} links={SHOP.links} className={rule} />
          {CONCERN_COLS.map((list, i) => (
            <Col
              key={i}
              title={`Shop by concern · ${i ? "II" : "I"}`}
              links={[
                ...list.map((c) => ({ label: c.name, href: `/shop?concern=${c.slug}` })),
                ...(i ? [{ label: "View All Concerns", href: "/shop" }] : []),
              ]}
              className={rule}
            />
          ))}
          <div className={cn(rule, "col-span-2 lg:col-span-1")}>
            <Col title={CONSULT.title} links={CONSULT.links} />
            <Link
              href="/skin-assessment"
              className="group mt-6 block rounded-2xl border border-[#d9b46a]/50 bg-[#123d36] px-5 py-4 transition hover:border-[#d9b46a] hover:bg-[#164a41]"
            >
              <span className="flex items-center justify-between gap-3 font-semibold uppercase tracking-wide">
                Not sure where to start?
                <ArrowRight className="size-4 text-[#d9b46a] transition-transform group-hover:translate-x-1" />
              </span>
              <span className={cn("mt-1 block text-sm", GOLD)}>Take the free 1-minute skin quiz</span>
            </Link>
          </div>
        </div>

        {/* company, journal, care, legal */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-[#b8955a]/50 py-12 lg:grid-cols-4 lg:gap-8">
          {LOWER.map((g, i) => (
            <Col key={g.title} title={g.title} links={g.links} className={i ? rule : undefined} />
          ))}
        </div>

        {/* offices */}
        <div className="border-t border-[#b8955a]/50 py-12">
          <p className={heading}>Global offices &amp; contact</p>
          <div className="mt-6 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {OFFICES.map((o, i) => (
              <div key={o.title} className={i ? rule : undefined}>
                <p className={cn(heading, "text-sm")}>{o.title}</p>
                <div className="mt-4 space-y-2 text-white/85">
                  {o.lines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                  <a href={tel(o.phone)} className="block transition-colors hover:text-[#d9b46a]">
                    {o.phone}
                  </a>
                </div>
              </div>
            ))}
            <div className={rule}>
              <p className={cn(heading, "text-sm")}>Customer support</p>
              <div className="mt-4 space-y-2 text-white/85">
                <a href={`mailto:${site.email}`} className="block transition-colors hover:text-[#d9b46a]">
                  {site.email}
                </a>
                <p>
                  <Link href="/faqs" className={linkCls}>Help Center</Link>
                  <span className="mx-2 text-[#d9b46a]">•</span>
                  <Link href="/account/orders" className={linkCls}>Order Tracking</Link>
                </p>
                <Link href="/contact" className={cn(linkCls, "block")}>Contact Us</Link>
              </div>
            </div>
          </div>
        </div>

        {/* region + socials */}
        <div className="flex flex-col gap-6 border-t border-white/15 py-6 lg:flex-row lg:items-center lg:justify-between">
          <FooterCurrency />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <p className={heading}>Follow Dermisque</p>
            <ul className="flex flex-wrap gap-3 sm:gap-4">
              {site.socials.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.name}
                    className="group flex text-white/85"
                  >
                    <span className="grid size-11 place-items-center rounded-full border-2 border-[#b8955a]/70 transition duration-300 group-hover:-translate-y-1 group-hover:border-[#d9b46a] group-hover:bg-[#d9b46a] group-hover:text-[#0d2925]">
                      <SocialIcon name={s.name} />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* legal line */}
        <div className="flex flex-col gap-3 border-t border-white/15 py-6 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.wordmark}. {site.wordmark} is a trading name of {site.company} All rights reserved.
          </p>
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {[
              ["Privacy", "/policies/privacy"],
              ["Terms", "/policies/terms"],
              ["Cookies", "/policies/cookies"],
              ["Accessibility", "/policies/accessibility"],
            ].map(([label, href], i) => (
              <span key={href} className="flex items-center gap-2.5">
                {i > 0 && <span className="text-[#d9b46a]">•</span>}
                <Link href={href} className="transition-colors hover:text-[#d9b46a]">
                  {label}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Simple monochrome brand marks (lucide no longer ships brand icons). */
function SocialIcon({ name }: { name: string }) {
  const svg = "size-[1.1rem]";
  switch (name) {
    case "Instagram":
      return (
        <svg viewBox="0 0 24 24" className={svg} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "YouTube":
      return (
        <svg viewBox="0 0 24 24" className={svg} fill="currentColor">
          <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
        </svg>
      );
    default: {
      const letter = { Facebook: "f", X: "X", Pinterest: "P", LinkedIn: "in" }[name] ?? name[0];
      return <span className="text-sm font-bold leading-none">{letter}</span>;
    }
  }
}
