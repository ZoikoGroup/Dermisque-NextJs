"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useCurrency } from "./currency-provider";

const ease = [0.22, 1, 0.36, 1] as const;
const canHover = () => window.matchMedia("(hover: hover)").matches;

/** Floating side switcher: a slim tab on the right edge that opens the "Select your currency" panel. */
export function CurrencySwitcher() {
  const { currency, setCurrency, pending } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (c: Currency) => {
    if (c !== currency) setCurrency(c);
    setOpen(false);
  };

  return (
    <div
      ref={ref}
      className="fixed right-0 top-1/2 z-40 -translate-y-1/2"
      onMouseEnter={() => canHover() && setOpen(true)}
      onMouseLeave={() => canHover() && setOpen(false)}
    >
      <div className="flex items-center">
        <AnimatePresence>
          {open && (
            <motion.div
              role="dialog"
              aria-label="Select your currency"
              initial={{ opacity: 0, x: 24, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.97 }}
              transition={{ duration: 0.35, ease }}
              className="mr-2 w-[min(380px,calc(100vw-5rem))] origin-right overflow-hidden rounded-2xl bg-ink text-white shadow-[0_30px_60px_-20px_rgba(11,11,15,0.6)]"
            >
              <div className="relative overflow-hidden px-6 py-5">
                <div aria-hidden className="absolute -right-10 -top-10 size-32 rounded-full bg-sun/40 blur-2xl" />
                <p className="relative text-lg font-medium uppercase tracking-[0.12em]">Select your currency</p>
                <p className="relative mt-0.5 text-xs text-white/50">Prices update across the store</p>
              </div>
              <ul className="pb-2">
                {(Object.keys(CURRENCIES) as Currency[]).map((c, i) => {
                  const meta = CURRENCIES[c];
                  const active = c === currency;
                  return (
                    <motion.li
                      key={c}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + i * 0.05, ease }}
                    >
                      <button
                        type="button"
                        onClick={() => choose(c)}
                        aria-pressed={active}
                        className={cn(
                          "group relative flex w-full items-center gap-4 px-6 py-4 text-left text-sm uppercase tracking-wide transition-colors duration-300",
                          active ? "bg-sun text-white" : "hover:bg-white/10",
                        )}
                      >
                        {!active && (
                          <span aria-hidden className="absolute inset-y-0 left-0 w-1 origin-center scale-y-0 bg-brand transition-transform duration-300 group-hover:scale-y-100" />
                        )}
                        <span className="w-10 font-semibold">{meta.code}</span>
                        <span className="flex-1 whitespace-nowrap text-center text-[13px] font-medium">{meta.label}</span>
                        <span className="grid size-5 place-items-center">
                          {active && (pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />)}
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((o) => (canHover() ? true : !o))}
          aria-expanded={open}
          aria-label={`Currency: ${currency}. Change currency`}
          className="flex flex-col items-center gap-1.5 rounded-l-2xl bg-ink py-3 pl-2.5 pr-2 text-white shadow-xl transition-all duration-300 hover:pr-3"
        >
          <ChevronLeft className={cn("size-3.5 text-white/60 transition-transform duration-300", open && "rotate-180")} />
          <span className="grid size-8 place-items-center rounded-full bg-brand text-sm font-bold text-ink">
            {CURRENCIES[currency].symbol}
          </span>
          <span className="text-[11px] font-semibold tracking-wider">{currency}</span>
        </button>
      </div>
    </div>
  );
}
