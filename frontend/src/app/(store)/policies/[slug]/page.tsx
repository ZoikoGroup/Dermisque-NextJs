import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/ui/reveal";
import { site } from "@/lib/site";

// Starter policy copy — have it reviewed by your legal team before launch.
const CARE_EMAIL = "care@dermisque.com";

type Policy = {
  title: string;
  intro?: string;
  numbered?: boolean;
  sections: { h: string; p: string; list?: string[] }[];
  outro?: string;
  cta?: { href: string; label: string };
};

const policies: Record<string, Policy> = {
  shipping: {
    title: "Shipping Policy",
    sections: [
      { h: "Delivery times", p: "Orders are processed within 1–2 business days and typically delivered within 2–7 days of dispatch." },
      { h: "Shipping charges", p: "Shipping is free on orders over $15. Orders below that carry a flat $4.99 shipping fee." },
      { h: "Order tracking", p: "Once your order ships, a tracking number appears under My Account → Orders." },
      { h: "Delays", p: "Occasionally deliveries are delayed by carriers, weather or customs. If your order hasn't arrived within 10 days, contact us and we'll help." },
    ],
  },
  replacement: {
    title: "Return or Replacement Policy",
    intro:
      "This policy of DERMISQUE outlines the conditions under which customers/users/consumers can receive a replacement product for a defective or damaged item. Here are some terms and conditions for this policy.",
    numbered: true,
    sections: [
      {
        h: "Condition for return",
        p: "You can submit a request for a return or replacement if the product qualifies for replacement on our website. Only items that are new, unused, untampered, in/with their original packing, with all the tags and labels still attached, are eligible to be returned or replaced. In case of a breakage or spillage complaint, an opening video of the product is mandatory.",
      },
      {
        h: "Timeframe for returns",
        p: "We will not accept returns of products if their complete packaging, labels, or stickers are missing or have been tampered with, within 5 days from the date of delivery.",
      },
      {
        h: "Return process",
        p: "Once you request a return, you are responsible for sending the product back to us. Please ship the item to the nearest address provided by us, either in the USA or the UK, depending on your location. The return must be initiated within 5–10 business days following the approval of your return request. Your refund will be processed after the returned product is received and has passed inspection/testing by our Quality Control (QC) Team.",
      },
      {
        h: "Proof of purchase",
        p: "A copy of the receipt/invoice of the product(s) needs to be attached/furnished along with a photo or description of the reason for seeking a refund/replacement.",
      },
      {
        h: "Shipping and handling",
        p: `For replacement/exchange of the product(s), the customer needs to send a return request to ${CARE_EMAIL} including the place of purchase, the customer details, the order number, and a description of the replaced/exchanged product accompanied by the proof of purchase. Once the product(s) is picked up and received, the process mentioned under clause 6 shall be followed.`,
      },
      {
        h: "Approval process",
        p: "All returns or exchanges are subject to approval by the QC Team. Once the product(s) is received, the product(s) shall be inspected, and the customer will be notified regarding the status of the refund/exchange. All return requests/exchanges shall be processed within 7 working days (from the date of receipt of the product by the QC Team); however, this timeline may change as per the complexity, exigency, or any other reason and as per the discretion of the company. The company may or may not inform the user/customer about the reason for such a delay.",
      },
      {
        h: "Refund method",
        p: "The refund shall be initiated to either the original payment mode or any mode decided by the company.",
      },
      {
        h: "Non-returnable items",
        p: "The following product(s) shall not be considered for return/exchange:",
        list: ["Gift boxes", "Gift cards", "Items sold in a non-recognised store/mode"],
      },
    ],
    outro: "DERMISQUE is committed to customer satisfaction and customer delight.",
    cta: { href: "/contact", label: "Replacement Request Form" },
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      { h: "What we collect", p: "Your name, email, phone, shipping address and order history, so we can process and deliver your orders and support your account." },
      { h: "How we use it", p: "To fulfil orders, provide customer support, and — only if you subscribe — send news and offers. We never sell your personal data." },
      { h: "Payments", p: "Card details are passed directly to our payment processor and are never stored on our servers." },
      { h: "Your rights", p: `You can access, correct or delete your data at any time. Contact ${site.email}.` },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export default async function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) notFound();
  return (
    <div className="container-luxe max-w-3xl py-16">
      <Reveal>
        <p className="eyebrow">Customer service</p>
        <h1 className="mt-3 font-display text-5xl">{policy.title}</h1>
      </Reveal>
      {policy.intro && (
        <Reveal>
          <p className="mt-6 leading-relaxed text-ink-soft">{policy.intro}</p>
        </Reveal>
      )}
      <div className="mt-10 space-y-6">
        {policy.sections.map((s, i) => (
          <Reveal key={s.h}>
            <section className="rounded-3xl bg-white p-7">
              <h2 className="font-display text-2xl">
                {policy.numbered && <span className="mr-2 text-mute">{i + 1}.</span>}
                {s.h}
              </h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{s.p}</p>
              {s.list && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-ink-soft">
                  {s.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          </Reveal>
        ))}
      </div>
      {(policy.outro || policy.cta) && (
        <Reveal>
          <div className="mt-10 rounded-3xl bg-white p-7 text-center">
            {policy.outro && <p className="font-display text-xl">{policy.outro}</p>}
            {policy.cta && (
              <Link
                href={policy.cta.href}
                className="mt-5 inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-semibold text-white transition hover:bg-ink/85"
              >
                {policy.cta.label}
              </Link>
            )}
            <p className="mt-4 text-sm text-mute">
              Send your queries to{" "}
              <a href={`mailto:${CARE_EMAIL}`} className="underline underline-offset-2 hover:text-ink">
                {CARE_EMAIL}
              </a>
            </p>
          </div>
        </Reveal>
      )}
    </div>
  );
}
