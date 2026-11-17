"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import {
  ArrowRight,
  CalendarDays,
  Droplet,
  Droplets,
  Eye,
  MessageSquareText,
  ScanFace,
  Sparkle,
  Sparkles,
  Sun,
  SunMedium,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { concerns } from "@/lib/site";
import { cn } from "@/lib/utils";

export type MenuKey = "products" | "concern" | "consult";

const ease = [0.22, 1, 0.36, 1] as const;

/** Children fade up one after another once the panel opens. */
const list: Variants = { show: { transition: { staggerChildren: 0.035, delayChildren: 0.08 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

/** Opens the chat assistant (listened for in ChatWidget). */
export const openChat = () => window.dispatchEvent(new Event("dq:open-chat"));

export function NavMenu({ menu, onNavigate }: { menu: MenuKey; onNavigate: () => void }) {
  return (
    <motion.div
      key={menu}
      initial={{ opacity: 0, y: -12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.99, transition: { duration: 0.18 } }}
      transition={{ duration: 0.4, ease }}
      className="relative origin-top overflow-hidden rounded-[1.75rem] border border-white bg-[#fdfcf9] shadow-[0_40px_90px_-40px_rgba(15,61,53,0.45),0_12px_30px_-20px_rgba(0,0,0,0.2)]"
    >
      {/* gold → teal accent line drawing in across the top */}
      <motion.span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] origin-left bg-[linear-gradient(90deg,#b8955a,#1f7a6e_60%,#9fd3cb)]"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, ease }}
      />
      <motion.div variants={list} initial="hidden" animate="show" className="px-8 pb-8 pt-9 xl:px-14 xl:pb-10 xl:pt-11">
        {menu === "products" && <ProductsMenu onNavigate={onNavigate} />}
        {menu === "concern" && <ConcernMenu onNavigate={onNavigate} />}
        {menu === "consult" && <ConsultMenu onNavigate={onNavigate} />}
      </motion.div>
    </motion.div>
  );
}

function Intro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <motion.div variants={item}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#1f7a6e]">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl text-[#0f3d35] xl:text-[2.6rem] xl:leading-tight">{title}</h2>
      <p className="mt-2 text-ink-soft">{text}</p>
    </motion.div>
  );
}

const Arrow = ({ className }: { className?: string }) => (
  <ArrowRight
    className={cn(
      "size-4 shrink-0 text-[#b8955a] transition-transform duration-300 group-hover:translate-x-1",
      className,
    )}
  />
);

/* ---------------------------------------------------------------- products */

const PRODUCT_COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Shop by category",
    links: [
      ["All Products", "/shop"],
      ["Face Serums", "/collections/face-serums"],
      ["Eye Care", "/collections/eye-care"],
      ["Lip Care", "/collections/lip-care"],
      ["Hair & Scalp", "/collections/hair-scalp"],
    ],
  },
  {
    title: "Shop by routine",
    links: [
      ["Brightening & Radiance", "/collections/brightening-radiance"],
      ["Hydration", "/collections/hydration"],
      ["Visible Aging", "/collections/visible-aging"],
      ["Even-Looking Tone", "/collections/even-tone"],
      ["Hair Care", "/collections/hair-scalp"],
    ],
  },
  {
    title: "Discover",
    links: [
      ["Top Rated", "/collections/top-rated"],
      ["New Arrivals", "/collections/new-arrivals"],
      ["24 KT Gold Serum", "/product/24kt-gold-serum"],
      ["3X Vitamin C Face Serum", "/product/vitamin-c-face-serum"],
      ["3X Skin Hydrating Serum", "/product/skin-hydrating-face-serum"],
    ],
  },
];

function ProductsMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <>
      <Intro
        eyebrow="Product discovery"
        title="Explore the Dermisque collection."
        text="Find your next serum by product, routine, or skin and hair care need."
      />
      <div className="mt-8 grid grid-cols-[1fr_1fr_1fr_1.05fr] divide-x divide-line">
        {PRODUCT_COLUMNS.map((col, i) => (
          <motion.div key={col.title} variants={item} className={cn("pr-8", i > 0 && "pl-8")}>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-mute">{col.title}</p>
            <ul className="mt-4">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className="group flex items-center justify-between border-b border-line/80 py-3 font-medium text-ink transition-colors hover:text-[#0f3d35]"
                  >
                    <span className="transition-transform duration-300 group-hover:translate-x-1">{label}</span>
                    <Arrow />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
        <motion.div variants={item} className="pl-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-mute">Featured collection</p>
          <Link
            href="/product/24kt-gold-serum"
            onClick={onNavigate}
            className="group mt-4 block overflow-hidden rounded-2xl border-[5px] border-[#f3ece1] shadow-sm"
          >
            <span className="relative block aspect-[1.6] overflow-hidden rounded-xl">
              <Image
                src="/products/gold-serum.jpg"
                alt="Dermisque 24 KT Gold Serum"
                fill
                sizes="340px"
                className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-luxe)] group-hover:scale-110"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <span className="absolute bottom-3 left-4 text-white">
                <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.3em] opacity-85">New icon</span>
                <span className="font-display text-2xl">24 KT Gold Serum</span>
              </span>
            </span>
          </Link>
          <Link
            href="/collections"
            onClick={onNavigate}
            className="group mt-5 inline-flex items-center gap-2 font-semibold text-[#0f3d35]"
          >
            Explore the Dermisque collection <Arrow className="text-[#0f3d35]" />
          </Link>
        </motion.div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- concerns */

const CONCERN_META: Record<string, { label: string; icon: LucideIcon }> = {
  "dull-skin": { label: "Dullness & Radiance", icon: Sparkle },
  dryness: { label: "Dryness & Dehydration", icon: Droplet },
  acne: { label: "Acne-Prone & Blemishes", icon: SunMedium },
  wrinkles: { label: "Fine Lines & Wrinkles", icon: ScanFace },
  "dark-spots": { label: "Dark Spots & Uneven Tone", icon: Sparkles },
  "dark-circles": { label: "Dark Circles & Puffiness", icon: Eye },
  "sun-damage": { label: "Sun-Exposed Skin", icon: Sun },
  "hair-loss": { label: "Hair & Scalp", icon: Waves },
  pigmentation: { label: "Pigmentation", icon: Droplets },
};

function ConcernMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <>
      <Intro
        eyebrow="Beauty that starts with understanding"
        title="Shop by your skin and hair care goals."
        text="Explore thoughtfully organised collections. Choose what matters most to you."
      />
      <div className="mt-7 grid grid-cols-3 gap-3.5">
        {concerns.map((c) => {
          const meta = CONCERN_META[c.slug] ?? { label: c.name, icon: Sparkle };
          const Icon = meta.icon;
          return (
            <motion.div key={c.slug} variants={item}>
              <Link
                href={`/shop?concern=${c.slug}`}
                onClick={onNavigate}
                className="group flex items-center gap-4 rounded-2xl border border-line bg-white/70 px-5 py-5 font-semibold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-[#b8955a]/60 hover:bg-white hover:shadow-[0_18px_40px_-28px_rgba(15,61,53,0.6)]"
              >
                <Icon className="size-5 shrink-0 text-[#b8955a] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" strokeWidth={1.6} />
                <span className="flex-1">{meta.label}</span>
                <Arrow />
              </Link>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-5">
        <PromoCard
          title="Your skin. Your routine."
          text="Not sure where to start? Take our free 1-minute skin assessment."
          cta="Start the assessment"
          href="/skin-assessment"
          onNavigate={onNavigate}
        />
        <PromoCard
          title="Need a little guidance?"
          text="Book a free one-to-one consultation with our skincare team."
          cta="Consultation options"
          href="/consultation"
          onNavigate={onNavigate}
        />
      </div>
    </>
  );
}

function PromoCard({
  title,
  text,
  cta,
  href,
  onNavigate,
}: {
  title: string;
  text: string;
  cta: string;
  href: string;
  onNavigate: () => void;
}) {
  return (
    <motion.div
      variants={item}
      className="flex items-center justify-between gap-4 rounded-2xl bg-[linear-gradient(100deg,#e3efe9_0%,#f4efe4_100%)] px-6 py-5"
    >
      <div>
        <p className="font-display text-xl text-[#0f3d35]">{title}</p>
        <p className="mt-1 text-sm text-ink-soft">{text}</p>
      </div>
      <Link
        href={href}
        onClick={onNavigate}
        className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#0f3d35]/25 bg-white/70 px-5 py-2.5 text-sm font-semibold text-[#0f3d35] transition hover:bg-[#0f3d35] hover:text-white"
      >
        {cta} <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- consultation */

function ConsultMenu({ onNavigate }: { onNavigate: () => void }) {
  const cards: { icon: LucideIcon; title: string; text: string; cta: string; href?: string; chat?: boolean }[] = [
    {
      icon: CalendarDays,
      title: "Free Skin Consultation",
      text: "Request one-to-one skincare product guidance from the Dermisque team.",
      cta: "Request a consultation",
      href: "/consultation",
    },
    {
      icon: MessageSquareText,
      title: "Talk to a Product Expert",
      text: "Ask a question about ingredients, products, and which serum to explore.",
      cta: "Chat with us now",
      chat: true,
    },
    {
      icon: Sparkles,
      title: "Free Skin Assessment",
      text: "Answer four quick questions and get a personalised 3-step serum routine.",
      cta: "Take the 1-minute quiz",
      href: "/skin-assessment",
    },
  ];
  const cls =
    "group flex h-full w-full flex-col rounded-3xl border border-line bg-[linear-gradient(160deg,#ffffff_0%,#f3f8f5_100%)] p-7 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#b8955a]/50 hover:shadow-[0_24px_50px_-30px_rgba(15,61,53,0.6)]";
  return (
    <>
      <Intro
        eyebrow="Help from the start"
        title="A better way to find what works for your routine."
        text="Choose one-to-one support or explore guidance on your own terms."
      />
      <div className="mt-8 grid grid-cols-3 gap-5">
        {cards.map(({ icon: Icon, title, text, cta, href, chat }) => {
          const body = (
            <>
              <span className="grid size-14 place-items-center rounded-2xl bg-[#e3efe9] text-[#0f3d35] transition-all duration-500 group-hover:rotate-6 group-hover:bg-[#0f3d35] group-hover:text-white">
                <Icon className="size-6" strokeWidth={1.6} />
              </span>
              <span className="mt-7 font-display text-2xl text-[#0f3d35]">{title}</span>
              <span className="mt-2 leading-relaxed text-ink-soft">{text}</span>
              <span className="mt-auto inline-flex items-center gap-2 pt-10 font-semibold text-[#0f3d35]">
                {cta} <Arrow className="text-[#0f3d35]" />
              </span>
            </>
          );
          return (
            <motion.div key={title} variants={item}>
              {chat ? (
                <button
                  type="button"
                  className={cls}
                  onClick={() => {
                    onNavigate();
                    openChat();
                  }}
                >
                  {body}
                </button>
              ) : (
                <Link href={href!} onClick={onNavigate} className={cls}>
                  {body}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
