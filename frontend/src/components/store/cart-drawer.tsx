"use client";

import { usePrice } from "@/components/store/currency-provider";
import Image from "@/components/ui/product-image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart, cartSubtotal, cartCount } from "@/store/cart";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";

export function CartDrawer() {
  const formatPrice = usePrice();
  const { items, open, setOpen, setQty, remove } = useCart();
  const subtotal = cartSubtotal(items);
  const remaining = Math.max(0, site.freeShippingThreshold - subtotal);
  const progress = Math.min(100, (subtotal / site.freeShippingThreshold) * 100);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.aside
            role="dialog"
            aria-label="Shopping bag"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="font-display text-2xl">
                Your Bag <span className="text-base text-mute">({cartCount(items)})</span>
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close cart"
                className="rounded-full p-2 transition hover:rotate-90 hover:bg-ink/5"
              >
                <X className="size-5" />
              </button>
            </div>

            {items.length > 0 && (
              <div className="border-b border-line px-6 py-4">
                <p className="mb-2 text-xs text-ink-soft">
                  {remaining > 0 ? (
                    <>
                      You&apos;re <b>{formatPrice(remaining)}</b> away from <b>free shipping</b>
                    </>
                  ) : (
                    <>🎉 You&apos;ve unlocked <b>free shipping</b></>
                  )}
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <motion.div
                    className="h-full rounded-full bg-brand"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-5 grid size-20 place-items-center rounded-full bg-brand-soft"
                  >
                    <ShoppingBag className="size-8" />
                  </motion.div>
                  <p className="font-display text-2xl">Your bag is empty</p>
                  <p className="mt-2 text-sm text-mute">Discover serums made for your skin.</p>
                  <ButtonLink href="/shop" className="mt-6" onClick={() => setOpen(false)}>
                    Shop now
                  </ButtonLink>
                </div>
              ) : (
                <ul className="space-y-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.35 }}
                        className="flex gap-4 rounded-2xl bg-white p-3"
                      >
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={() => setOpen(false)}
                          className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-sand"
                        >
                          <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-medium leading-snug">{item.name}</p>
                            <button
                              onClick={() => remove(item.id)}
                              aria-label={`Remove ${item.name}`}
                              className="shrink-0 rounded-full p-1 text-mute transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <QtyStepper
                              value={item.quantity}
                              onChange={(q) => setQty(item.id, q)}
                              max={item.stock}
                            />
                            <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-3 border-t border-line bg-white px-6 py-5">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-soft">Subtotal</span>
                  <span className="text-lg font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-xs text-mute">Taxes included. Discounts & shipping calculated at checkout.</p>
                <ButtonLink href="/checkout" size="lg" className="w-full" onClick={() => setOpen(false)}>
                  Checkout securely
                </ButtonLink>
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="block text-center text-sm underline-offset-4 hover:underline"
                >
                  View full bag
                </Link>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function QtyStepper({
  value,
  onChange,
  max = 99,
  size = "sm",
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  size?: "sm" | "lg";
}) {
  const s = size === "lg" ? "h-12 w-12" : "h-8 w-8";
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-white">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className={`${s} grid place-items-center rounded-full transition hover:bg-ink hover:text-white`}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <motion.span
        key={value}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-8 text-center text-sm font-semibold tabular-nums"
      >
        {value}
      </motion.span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`${s} grid place-items-center rounded-full transition hover:bg-ink hover:text-white disabled:opacity-40`}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
