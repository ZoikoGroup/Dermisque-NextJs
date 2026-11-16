"use client";

import { usePrice } from "@/components/store/currency-provider";
import Image from "@/components/ui/product-image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { QtyStepper } from "@/components/store/cart-drawer";
import { ButtonLink } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { cartItemHref } from "@/lib/black-friday";
import { computeTotals } from "@/lib/pricing";
import { site } from "@/lib/site";
import { cartSubtotal, useCart } from "@/store/cart";

export default function CartPage() {
  const formatPrice = usePrice();
  const mounted = useMounted();
  const { items, setQty, remove } = useCart();
  const totals = computeTotals(cartSubtotal(items));

  if (!mounted) {
    return (
      <div className="container-luxe py-16">
        <div className="skeleton h-12 w-64" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="skeleton h-32 !rounded-3xl" />
            ))}
          </div>
          <div className="skeleton h-72 !rounded-3xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-luxe flex flex-col items-center py-28 text-center">
        <div className="mb-6 grid size-24 place-items-center rounded-full bg-brand-soft">
          <ShoppingBag className="size-10" />
        </div>
        <h1 className="font-display text-4xl">Your bag is empty</h1>
        <p className="mt-3 text-ink-soft">Find the serum your skin has been waiting for.</p>
        <ButtonLink href="/shop" size="lg" className="mt-8">
          Start shopping
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="container-luxe py-12">
      <h1 className="font-display text-5xl">Your bag</h1>
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="space-y-4">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.id}
                layout
                exit={{ opacity: 0, x: -40 }}
                className="flex gap-5 rounded-3xl bg-white p-4"
              >
                <Link href={cartItemHref(item)} className="group relative size-28 shrink-0 overflow-hidden rounded-2xl bg-sand">
                  <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-4">
                    <Link href={cartItemHref(item)} className="font-display text-lg leading-snug hover:underline">
                      {item.name}
                    </Link>
                    <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                  <p className="text-sm text-mute">{formatPrice(item.price)} each</p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <QtyStepper value={item.quantity} onChange={(q) => setQty(item.id, q)} max={item.stock} />
                    <button
                      onClick={() => remove(item.id)}
                      className="flex items-center gap-1.5 text-sm text-mute transition hover:text-red-600"
                    >
                      <Trash2 className="size-4" /> Remove
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <aside className="sticky top-24 rounded-3xl bg-white p-6">
          <p className="font-display text-2xl">Order summary</p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd>{formatPrice(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping</dt>
              <dd>{totals.shipping === 0 ? <span className="text-emerald-700">Free</span> : formatPrice(totals.shipping)}</dd>
            </div>
            {totals.shipping > 0 && (
              <p className="text-xs text-mute">
                Add {formatPrice(site.freeShippingThreshold - totals.subtotal)} more for free shipping.
              </p>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(totals.total)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-mute">Have a code? Apply it at checkout.</p>
          <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
            Checkout <ArrowRight className="size-4" />
          </ButtonLink>
          <Link href="/shop" className="mt-4 block text-center text-sm text-ink-soft hover:text-ink">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
