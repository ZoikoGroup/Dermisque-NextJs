import { notFound } from "next/navigation";
import { Reveal } from "@/components/ui/reveal";
import { site } from "@/lib/site";

// Starter policy copy — have it reviewed by your legal team before launch.
const policies: Record<string, { title: string; sections: { h: string; p: string }[] }> = {
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
    title: "Replacement Policy",
    sections: [
      { h: "Damaged or incorrect items", p: "If your product arrives damaged, leaking or incorrect, contact us within 7 days of delivery with your order number and photos. We'll send a replacement at no cost." },
      { h: "Unopened products", p: "For hygiene reasons we can only accept unopened, sealed products for replacement." },
      { h: "Reactions", p: "Always patch-test before use. If you experience irritation, stop using the product and contact us — we'll review each case individually." },
      { h: "How to request", p: `Email ${site.email} or call ${site.phones[0].value} with your order number.` },
    ],
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
      <div className="mt-10 space-y-6">
        {policy.sections.map((s) => (
          <Reveal key={s.h}>
            <section className="rounded-3xl bg-white p-7">
              <h2 className="font-display text-2xl">{s.h}</h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{s.p}</p>
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
