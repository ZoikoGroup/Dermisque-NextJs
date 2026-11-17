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
  terms: {
    title: "Terms of Use",
    intro: `These terms apply to your use of the ${site.wordmark} website and to orders placed through it. By using the site you agree to them.`,
    numbered: true,
    sections: [
      { h: "Who we are", p: `${site.wordmark} is a trading name of ${site.company}` },
      { h: "Using the website", p: "You may browse and shop for personal, non-commercial use. Please don't misuse the site, attempt to access it in unauthorised ways, or copy its content without permission." },
      { h: "Your account", p: "You're responsible for keeping your login details secure and for activity on your account. Tell us straight away if you think someone else has used it." },
      { h: "Orders and pricing", p: "Placing an order is an offer to buy. We'll confirm by email once it's accepted. Prices and promotions can change, and we may cancel orders affected by an obvious pricing error, refunding you in full." },
      { h: "Product information", p: "Our serums are cosmetic products. Information on this site is general skincare guidance, not medical advice. Always patch-test new products and consult a professional for skin conditions." },
      { h: "Returns and replacements", p: "Damaged, defective or incorrect items are covered by our Return or Replacement Policy." },
      { h: "Intellectual property", p: `All content on this site, including the ${site.wordmark} name, logo, images and text, belongs to us or our licensors.` },
      { h: "Changes to these terms", p: "We may update these terms from time to time. The version on this page applies to your use of the site today." },
    ],
    outro: `Questions about these terms? Email ${site.email}.`,
    cta: { href: "/contact", label: "Contact us" },
  },
  cookies: {
    title: "Cookie Policy",
    intro: "Cookies are small files a website stores in your browser. We keep their use to a minimum.",
    sections: [
      {
        h: "Cookies we use",
        p: "We only use essential cookies that the shop needs to work:",
        list: [
          "dq_session: keeps you signed in to your account.",
          "dq_currency: remembers whether you're shopping in USD or GBP.",
        ],
      },
      {
        h: "Other browser storage",
        p: "Your bag and wishlist are saved in your browser's local storage so they're still there when you come back. We also note when you've seen our intro animation or dismissed the chat prompt, so we don't show them again.",
      },
      {
        h: "Analytics and advertising",
        p: "We don't use analytics, tracking or advertising cookies, and we don't share browsing data with third parties.",
      },
      {
        h: "Your preferences",
        p: "Because we only use essential cookies, there's nothing to opt in or out of. You can still clear or block cookies in your browser settings, but signing in and currency selection won't work without them.",
      },
    ],
    outro: "If we ever add non-essential cookies, we'll update this page and ask for your consent first.",
  },
  accessibility: {
    title: "Accessibility",
    intro: `We want everyone to be able to shop ${site.wordmark} comfortably, whatever device or assistive technology they use.`,
    sections: [
      {
        h: "What we do",
        p: "We design and build the site with accessibility in mind, aiming to follow WCAG 2.1 AA guidance:",
        list: [
          "Text alternatives for product and decorative images",
          "Keyboard-accessible menus, forms and the bag",
          "Readable colour contrast and resizable text",
          "Clear labels and error messages on every form",
          "Pages that work on phones, tablets and desktops",
        ],
      },
      { h: "Known limitations", p: "Some older blog images and third-party content may not yet meet every standard. We're working through them." },
      { h: "Need help?", p: "If anything on the site is difficult to use, tell us. We'll help you place your order another way and fix the problem." },
    ],
    outro: `Email ${site.email} or call our team using the numbers on the contact page.`,
    cta: { href: "/contact", label: "Contact us" },
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">) {
  const policy = policies[(await params).slug];
  return { title: policy?.title ?? "Policy not found" };
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
