import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Headset, Mail, MapPin, MessagesSquare, Network, Phone } from "lucide-react";
import { MessageForm } from "@/components/store/message-form";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";

export const metadata = { title: "Contact Us" };

const PHONES = ["+44 330 088 8958", "+1-800-699-4917"];
const DISTRIBUTOR_TOPIC = "Distributor enquiry";

const OFFICES = [
  { country: "UK", lines: ["Berkeley Suite, 35 Berkeley Square", "Mayfair, London W1J 5BF"] },
  { country: "USA", lines: ["12386 State Road 535 #302", "FL 32836, USA"] },
];

const HOURS = [
  { days: "Monday to Friday", time: "9:00 AM – 6:00 PM EST" },
  { days: "Saturday", time: "10:00 AM – 3:00 PM EST" },
  { days: "Sunday", time: "Closed" },
];

const tel = (n: string) => `tel:${n.replace(/[^+\d]/g, "")}`;

function Card({ icon: Icon, title, children }: { icon: ComponentType<{ className?: string }>; title: string; children: ReactNode }) {
  return (
    <div className="group flex h-full flex-col rounded-3xl bg-[#fde3c3] p-7 transition duration-500 hover:-translate-y-1 hover:shadow-xl">
      <span className="grid size-14 place-items-center rounded-2xl bg-white/70 transition duration-500 group-hover:bg-white">
        <Icon className="size-7" />
      </span>
      <h2 className="mt-5 font-display text-2xl">{title}</h2>
      <div className="mt-2 flex flex-1 flex-col text-sm text-ink-soft">{children}</div>
    </div>
  );
}

function Reach({ email }: { email: string }) {
  return (
    <ul className="mt-5 space-y-2 text-ink">
      <li>
        <a href={`mailto:${email}`} className="inline-flex items-center gap-2 font-medium hover:underline">
          <Mail className="size-4 text-mute" /> {email}
        </a>
      </li>
      {PHONES.map((n) => (
        <li key={n}>
          <a href={tel(n)} className="inline-flex items-center gap-2 font-medium hover:underline">
            <Phone className="size-4 text-mute" /> {n}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { topic } = await searchParams;
  const distributor = topic === "distributor";

  return (
    <div className="container-luxe py-16">
      <Reveal>
        <p className="eyebrow">Contact us</p>
        <h1 className="mt-3 max-w-2xl font-display text-5xl leading-tight sm:text-6xl">We&apos;d love to hear from you</h1>
        <p className="mt-4 max-w-xl text-ink-soft">
          Whether it&apos;s about an order, a partnership or becoming a distributor, the right team is one message away.
        </p>
      </Reveal>

      {/* who to contact */}
      <Stagger className="mt-12 grid gap-5 lg:grid-cols-3">
        <StaggerItem>
          <Card icon={Headset} title="Customer service">
            <p>Need help with our products or services? Our customer service team is here for you.</p>
            <Reach email="care@dermisque.com" />
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card icon={MessagesSquare} title="Business enquiries">
            <p>Interested in partnering with us or have a business proposition? Let&apos;s talk business.</p>
            <Reach email="support@dermisque.com" />
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card icon={Network} title="Distributor enquiries">
            <p>
              Enquire now to become a Dermisque distributor and elevate your business with clinically supported skincare
              solutions.
            </p>
            <Link
              href="/contact?topic=distributor#feedback"
              className="group/btn mt-5 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:bg-ink/85 lg:mt-auto"
            >
              Enquiry form <ArrowRight className="size-4 transition group-hover/btn:translate-x-1" />
            </Link>
          </Card>
        </StaggerItem>
      </Stagger>

      {/* head office + hours */}
      <Reveal className="mt-16">
        <p className="eyebrow">Head office</p>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl">Dermisque</h2>
        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.25em] text-ink-soft">Sum of Beauty</p>
      </Reveal>
      <Stagger className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr]">
        <StaggerItem className="md:col-span-2 lg:col-span-1">
          <div className="h-full rounded-3xl bg-white p-6 sm:p-7">
            <p className="flex items-center gap-2 font-medium">
              <Clock className="size-4 shrink-0 text-sun" /> Customer support hours (Eastern Standard Time)
            </p>
            <p className="mt-1 text-sm text-ink-soft">Our dedicated team is here to assist you during these hours:</p>
            <dl className="mt-4 divide-y divide-line text-sm">
              {HOURS.map((h) => (
                <div key={h.days} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-ink-soft">{h.days}</dt>
                  <dd className={h.time === "Closed" ? "font-medium text-mute" : "font-medium"}>{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </StaggerItem>
        {OFFICES.map((o) => (
          <StaggerItem key={o.country}>
            <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-ink p-7 text-white transition duration-500 hover:-translate-y-1 hover:shadow-xl sm:p-8">
              <span className="pointer-events-none absolute -right-4 -top-6 font-display text-[7rem] leading-none text-white/[0.06] transition duration-700 group-hover:text-white/10">
                {o.country}
              </span>
              <MapPin className="size-6 text-sun" />
              <p className="mt-auto pt-8 font-display text-3xl">{o.country}</p>
              <address className="mt-3 not-italic leading-relaxed text-white/75">
                {o.lines.map((l) => (
                  <span key={l} className="block">{l}</span>
                ))}
              </address>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      {/* feedback */}
      <section id="feedback" className="mt-16 scroll-mt-24 rounded-[2rem] bg-[#f3c48c] p-6 sm:p-10 lg:p-14">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <h2 className="font-display text-5xl sm:text-6xl">{distributor ? "Distributor enquiry" : "Feedback"}</h2>
            <p className="mt-5 font-semibold">Your opinions and experiences matter to us.</p>
            <p className="mt-1 text-ink-soft">
              {distributor
                ? "Tell us about your business, your region and the channels you sell through, and our partnerships team will be in touch."
                : "Please share your thoughts, suggestions, or concerns. We aim to respond promptly and effectively."}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <MessageForm key={distributor ? "distributor" : "feedback"} topic={distributor ? DISTRIBUTOR_TOPIC : undefined} />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
