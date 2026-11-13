import { Mail, MapPin, Phone } from "lucide-react";
import { MessageForm } from "@/components/store/message-form";
import { Reveal } from "@/components/ui/reveal";
import { site } from "@/lib/site";

export const metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="container-luxe py-16">
      <Reveal>
        <p className="eyebrow">Contact us</p>
        <h1 className="mt-3 max-w-2xl font-display text-5xl leading-tight sm:text-6xl">We&apos;d love to hear from you</h1>
        <p className="mt-4 max-w-xl text-ink-soft">
          Questions about an order, a product or your routine? Send us a message and our team will reply within 1–2 business days.
        </p>
      </Reveal>
      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <Reveal className="space-y-4">
          {site.addresses.map((a) => (
            <div key={a.label} className="group flex gap-4 rounded-3xl bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft transition group-hover:bg-brand">
                <MapPin className="size-5" />
              </span>
              <div>
                <p className="font-medium">{a.label}</p>
                {a.lines.map((l) => (
                  <p key={l} className="text-sm text-ink-soft">{l}</p>
                ))}
              </div>
            </div>
          ))}
          <div className="group flex gap-4 rounded-3xl bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft transition group-hover:bg-brand">
              <Phone className="size-5" />
            </span>
            <div className="space-y-1 text-sm">
              {site.phones.map((p) => (
                <p key={p.value}>
                  <span className="text-mute">{p.label}:</span>{" "}
                  <a href={`tel:${p.value.replace(/[^+\d]/g, "")}`} className="font-medium hover:underline">{p.value}</a>
                </p>
              ))}
            </div>
          </div>
          <div className="group flex gap-4 rounded-3xl bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft transition group-hover:bg-brand">
              <Mail className="size-5" />
            </span>
            <a href={`mailto:${site.email}`} className="self-center font-medium hover:underline">{site.email}</a>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <MessageForm type="CONTACT" />
        </Reveal>
      </div>
    </div>
  );
}
