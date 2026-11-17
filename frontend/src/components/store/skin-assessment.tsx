"use client";

import { useMemo, useState, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarHeart,
  Check,
  CircleDot,
  Contrast,
  Droplets,
  Eye,
  Feather,
  Hourglass,
  Lightbulb,
  Palette,
  RotateCcw,
  ScanFace,
  ShoppingBag,
  Smile,
  Sparkles,
  Sun,
  Wind,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { usePrice } from "@/components/store/currency-provider";
import type { ProductCardData } from "@/lib/types";
import { STEPS, isAnswers, label, recommend, type Answers, type StepKey } from "@/lib/skin-assessment";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";

type Icon = ComponentType<{ className?: string }>;

/** Illustration per option: an icon on its own soft gradient. */
const ART: Record<string, { icon: Icon; bg: string }> = {
  oily: { icon: Droplets, bg: "from-[#ffe7b8] to-[#ffc46b]" },
  dry: { icon: Wind, bg: "from-[#fde4d8] to-[#f6b9a0]" },
  combination: { icon: Contrast, bg: "from-[#e4f3f6] to-[#ffd9a8]" },
  normal: { icon: Smile, bg: "from-[#e6f6ee] to-[#b7e4cc]" },
  sensitive: { icon: Feather, bg: "from-[#fde2e6] to-[#f7b4bf]" },
  acne: { icon: CircleDot, bg: "from-[#fde4dc] to-[#f4a58f]" },
  "open-pores": { icon: ScanFace, bg: "from-[#f6ead9] to-[#e2c29b]" },
  pigmentation: { icon: Palette, bg: "from-[#f1e3d3] to-[#c99b72]" },
  "dark-circles": { icon: Eye, bg: "from-[#e7e4f6] to-[#b6addf]" },
  "acne-marks": { icon: Sparkles, bg: "from-[#fde3e1] to-[#eba3a0]" },
  aging: { icon: Hourglass, bg: "from-[#efe9f7] to-[#cdb9e8]" },
  "under-25": { icon: Sun, bg: "from-[#fff1c9] to-[#ffd36b]" },
  "25-34": { icon: Sparkles, bg: "from-[#ffe9cf] to-[#ffc08a]" },
  "35-44": { icon: CalendarHeart, bg: "from-[#fde3e6] to-[#f5aab6]" },
  "45-plus": { icon: Hourglass, bg: "from-[#ece6f8] to-[#c3b2e6]" },
};

const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -60 }),
};

export function SkinAssessment({
  products,
  initial,
  images = {},
}: {
  products: ProductCardData[];
  initial: Partial<Answers>;
  /** option value -> photo URL; options without one show their icon */
  images?: Record<string, string>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Partial<Answers>>(initial);
  const [step, setStep] = useState(isAnswers(initial) ? STEPS.length : 0);
  const [dir, setDir] = useState(1);
  const done = step >= STEPS.length && isAnswers(answers);

  function choose(key: StepKey, value: string) {
    const next = { ...answers, [key]: value } as Partial<Answers>;
    setAnswers(next);
    setDir(1);
    // brief pause so the tick is seen before moving on
    setTimeout(() => {
      setStep((s) => s + 1);
      if (isAnswers(next)) {
        router.replace(`/skin-assessment?${new URLSearchParams(next).toString()}`, { scroll: false });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 280);
  }

  function back() {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  function restart() {
    setDir(-1);
    setAnswers({});
    setStep(0);
    router.replace("/skin-assessment", { scroll: false });
  }

  if (done) return <Results answers={answers} products={products} onRestart={restart} onEdit={() => (setDir(-1), setStep(STEPS.length - 1))} />;

  const current = STEPS[step];
  const cols = current.options.length === 2 ? "sm:grid-cols-2" : current.options.length === 4 ? "grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3";

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-white p-5 shadow-[0_30px_80px_-40px_rgba(11,11,15,0.35)] sm:p-10">
      <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-mute">Skin assessment</p>
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={current.key}
          custom={dir}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="mt-3 text-center font-display text-3xl sm:text-4xl">
            {current.title} <span className="text-[#e11d2e]">*</span>
          </h2>
          <p className="mt-2 text-center text-sm text-ink-soft">{current.subtitle}</p>

          <div role="radiogroup" aria-label={current.title} className={cn("mt-8 grid gap-3 sm:gap-4", cols)}>
            {current.options.map((o) => {
              const art = ART[o.value];
              const Icon = art.icon;
              const selected = answers[current.key] === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(current.key, o.value)}
                  className={cn(
                    "group relative flex flex-col items-center rounded-3xl border-2 bg-white px-3 py-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(11,11,15,0.4)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sun/30 sm:py-7",
                    selected ? "border-sun shadow-[0_20px_40px_-24px_rgba(255,140,0,0.6)]" : "border-line hover:border-sun/60",
                  )}
                >
                  {selected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-sun text-white"
                    >
                      <Check className="size-3.5" />
                    </motion.span>
                  )}
                  <span
                    className={cn(
                      "relative grid size-20 place-items-center overflow-hidden rounded-full bg-gradient-to-br shadow-inner transition duration-500 group-hover:scale-105 sm:size-24",
                      art.bg,
                      selected && "ring-4 ring-sun/35",
                    )}
                  >
                    {images[o.value] ? (
                      <Image src={images[o.value]} alt="" fill sizes="96px" className="object-cover" />
                    ) : (
                      <Icon className="size-8 text-ink/80 transition duration-500 group-hover:rotate-6 sm:size-9" />
                    )}
                  </span>
                  <span className="mt-4 font-semibold">{o.label}</span>
                  <span className="mt-1 text-xs text-mute">{o.hint}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="mt-6 text-center text-xs text-mute">Fields marked with * are required.</p>
      <div className="mt-6 flex items-center gap-4 border-t border-line pt-6">
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-cream px-5 text-sm font-medium transition hover:bg-sand"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
        )}
        <div className="flex-1">
          <p className="text-xs font-semibold">
            Step {step + 1} of {STEPS.length}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,#ff8a00,#ffb300)]"
              initial={false}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Results({
  answers,
  products,
  onRestart,
  onEdit,
}: {
  answers: Answers;
  products: ProductCardData[];
  onRestart: () => void;
  onEdit: () => void;
}) {
  const price = usePrice();
  const add = useCart((s) => s.add);
  const result = useMemo(() => recommend(answers), [answers]);
  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
  const picks = result.picks.flatMap((pk) => {
    const product = bySlug.get(pk.slug);
    return product ? [{ ...pk, product }] : [];
  });
  const inStock = picks.filter((p) => p.product.stock > 0);
  const total = inStock.reduce((sum, p) => sum + p.product.price, 0);

  function addRoutine() {
    for (const { product: p } of inStock) add({ id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.image, stock: p.stock });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-10">
      {/* profile */}
      <div className="relative overflow-hidden rounded-[2rem] bg-ink p-7 text-white sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-sun/25 blur-3xl" />
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-sun">Your skin profile</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">{result.headline}.</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {STEPS.map((s) => (
            <span key={s.key} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs">
              <span className="text-white/55">{s.key === "sensitivity" ? "Type" : s.key[0].toUpperCase() + s.key.slice(1)}:</span>{" "}
              {label(s.key, answers[s.key])}
            </span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 text-white/75 underline-offset-4 hover:text-white hover:underline">
            <ArrowLeft className="size-4" /> Change answers
          </button>
          <button type="button" onClick={onRestart} className="inline-flex items-center gap-1.5 text-white/75 underline-offset-4 hover:text-white hover:underline">
            <RotateCcw className="size-4" /> Retake assessment
          </button>
        </div>
      </div>

      {/* routine */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Recommended for you</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">Your 3-step serum routine</h2>
          </div>
          {inStock.length > 0 && (
            <button
              type="button"
              onClick={addRoutine}
              className="sheen inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:shadow-xl"
            >
              <ShoppingBag className="size-4" /> Add routine to bag · {price(total)}
            </button>
          )}
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((p, i) => (
            <motion.div
              key={p.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.12, duration: 0.5 }}
              className="flex flex-col"
            >
              <p className="mb-3 flex items-center gap-2 text-sm">
                <span className="grid size-7 place-items-center rounded-full bg-sun text-xs font-bold text-white">{i + 1}</span>
                <span className="font-semibold">{p.role}</span>
              </p>
              <div className="flex-1">
                <ProductCard product={p.product} />
              </div>
              <p className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm leading-relaxed text-ink-soft">{p.why}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* tips + consultation */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[2rem] bg-white p-7 sm:p-8">
          <p className="flex items-center gap-2 font-display text-2xl">
            <Lightbulb className="size-5 text-sun" /> How to use your routine
          </p>
          <ul className="mt-5 space-y-3">
            {result.tips.map((t) => (
              <li key={t} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                <Check className="mt-0.5 size-4 shrink-0 text-teal" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-between rounded-[2rem] bg-[#fde3c3] p-7 sm:p-8">
          <div>
            <p className="font-display text-2xl">Want an expert opinion?</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Book a free one-to-one consultation and our skin expert will fine-tune this routine for you.
            </p>
          </div>
          <Link
            href="/consultation#assessment"
            className="group mt-6 inline-flex h-12 w-fit items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:bg-ink/85"
          >
            Book free consultation <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
