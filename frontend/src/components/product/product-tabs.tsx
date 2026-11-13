"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ProductDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductTabs({ product }: { product: ProductDetail }) {
  const tabs = [
    { id: "ingredients", label: "Key ingredients" },
    { id: "how", label: "How to use" },
    { id: "faq", label: "FAQs" },
  ];
  const [tab, setTab] = useState(tabs[0].id);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto rounded-full border border-line bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex-1 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
              tab === t.id ? "text-white" : "text-ink-soft hover:text-ink",
            )}
          >
            {tab === t.id && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="pt-8"
        >
          {tab === "ingredients" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {product.ingredients.map((ing, i) => (
                <div
                  key={ing.name}
                  className="ring-brand group rounded-3xl bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="font-display text-sm text-mute">0{i + 1}</span>
                  <p className="mt-2 font-display text-xl">{ing.name}</p>
                  <p className="mt-2 text-sm text-ink-soft">{ing.detail}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "how" && (
            <ol className="space-y-4">
              {product.howToUse.map((step, i) => (
                <li key={i} className="flex gap-5 rounded-3xl bg-white p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand font-display text-lg">
                    {i + 1}
                  </span>
                  <p className="pt-2 text-ink-soft">{step}</p>
                </li>
              ))}
              <li className="rounded-3xl border border-dashed border-line p-5 text-sm text-mute">
                For external use only. Patch-test before first use. Store below 25°C, away from direct sunlight.
              </li>
            </ol>
          )}

          {tab === "faq" && <Faqs faqs={product.faqs} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function Faqs({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line overflow-hidden rounded-3xl bg-white">
      {faqs.map((f, i) => (
        <div key={f.q}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-medium transition hover:bg-cream"
            aria-expanded={open === i}
          >
            {f.q}
            <ChevronDown className={cn("size-4 shrink-0 transition-transform duration-300", open === i && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <p className="px-6 pb-5 text-ink-soft">{f.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
