import { Faqs } from "@/components/product/product-tabs";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export const metadata = { title: "FAQs" };

const groups = [
  {
    title: "Orders & shipping",
    faqs: [
      { q: "How long does delivery take?", a: "Orders are usually delivered within 2–7 days of dispatch." },
      { q: "Do you offer free shipping?", a: "Yes — shipping is free on all orders over $15. A flat $4.99 applies below that." },
      { q: "How can I track my order?", a: "Sign in and open My Account → Orders. Each order shows its live status and tracking number once shipped." },
      { q: "Can I cancel my order?", a: "You can cancel from your account while the order is Pending or Processing. Paid orders are refunded to the original payment method." },
    ],
  },
  {
    title: "Discounts & payment",
    faqs: [
      { q: "Do you have a first-order discount?", a: "Use code NEW30 for 30% off your first order. Code DERMISQUE gives 25% off your second order." },
      { q: "Which payment methods do you accept?", a: "Major credit and debit cards, and cash on delivery." },
    ],
  },
  {
    title: "Products & usage",
    faqs: [
      { q: "Are Dermisque serums suitable for all skin types?", a: "Yes, our serums are formulated for all skin types. If you have sensitive skin, patch-test first and consult a dermatologist if irritation occurs." },
      { q: "Can I use more than one serum?", a: "Yes. Apply thinnest to thickest, and avoid combining exfoliating acids and retinol in the same routine. Book a free consultation for a personalised plan." },
      { q: "Are your products cruelty-free?", a: "Yes — Dermisque products are never tested on animals." },
    ],
  },
];

export default function FaqsPage() {
  return (
    <div className="container-luxe max-w-4xl py-16">
      <Reveal>
        <p className="eyebrow">Help centre</p>
        <h1 className="mt-3 font-display text-5xl sm:text-6xl">Frequently asked questions</h1>
      </Reveal>
      <div className="mt-12 space-y-10">
        {groups.map((g) => (
          <Reveal key={g.title}>
            <h2 className="mb-4 font-display text-2xl">{g.title}</h2>
            <Faqs faqs={g.faqs} />
          </Reveal>
        ))}
      </div>
      <div className="mt-14 rounded-3xl bg-white p-8 text-center">
        <p className="font-display text-2xl">Still have questions?</p>
        <ButtonLink href="/contact" className="mt-4">Contact us</ButtonLink>
      </div>
    </div>
  );
}
