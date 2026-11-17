import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/ui/misc";
import { NewsletterForm } from "./newsletter-form";
import { concerns, site } from "@/lib/site";

const cols = [
  {
    title: "Company",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About Us" },
      { href: "/shop", label: "Products" },
      { href: "/consultation", label: "Free Consultation" },
      { href: "/skin-assessment", label: "Free Skin Assessment" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
  {
    title: "Customer Service",
    links: [
      { href: "/account", label: "My Account" },
      { href: "/account/orders", label: "Track Order" },
      { href: "/blog", label: "Blogs" },
      { href: "/faqs", label: "FAQs" },
      { href: "/policies/shipping", label: "Shipping Policy" },
      { href: "/policies/replacement", label: "Replacement Policy" },
      { href: "/policies/privacy", label: "Privacy Policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-white">
      <div className="h-[3px] bg-brand" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-brand opacity-[0.08] blur-3xl"
      />

      <div className="container-luxe relative grid gap-12 py-16 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo light className="w-52" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/60">{site.description}</p>
          <div className="mt-8">
            <p className="mb-3 text-sm font-medium">Join the Dermisque circle</p>
            <NewsletterForm />
          </div>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <p className="eyebrow mb-5 !text-white/50">{c.title}</p>
            <ul className="space-y-3 text-sm">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-underline text-white/80 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="eyebrow mb-5 !text-white/50">Shop by concern</p>
          <ul className="space-y-3 text-sm">
            {concerns.slice(0, 7).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/shop?concern=${c.slug}`}
                  className="link-underline text-white/80 transition hover:text-white"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container-luxe relative grid gap-6 border-t border-white/10 py-10 text-sm text-white/70 md:grid-cols-3">
        {site.addresses.map((a) => (
          <div key={a.label} className="flex gap-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-amber" />
            <div>
              <p className="font-medium text-white">{a.label}</p>
              {a.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-x-8 gap-y-2 md:col-span-3">
          {site.phones.map((p) => (
            <a key={p.value} href={`tel:${p.value.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2 hover:text-white">
              <Phone className="size-4 text-aqua" /> {p.label}: {p.value}
            </a>
          ))}
          <a href={`mailto:${site.email}`} className="flex items-center gap-2 hover:text-white">
            <Mail className="size-4 text-aqua" /> {site.email}
          </a>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-luxe flex flex-col items-center justify-between gap-4 py-6 text-xs text-white/50 md:flex-row">
          <p>
            © {new Date().getFullYear()} {site.wordmark}. {site.wordmark} is a trading name for {site.company} All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            {site.socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-white"
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
