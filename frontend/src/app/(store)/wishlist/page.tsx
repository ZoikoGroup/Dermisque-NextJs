"use client";

import { usePrice } from "@/components/store/currency-provider";
import Image from "@/components/ui/product-image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Heart, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";

export default function WishlistPage() {
  const formatPrice = usePrice();
  const mounted = useMounted();
  const { items, remove } = useWishlist();
  const add = useCart((s) => s.add);

  return (
    <div className="container-luxe py-12">
      <p className="eyebrow">Saved for later</p>
      <h1 className="mt-2 font-display text-5xl">Wishlist</h1>

      {!mounted ? (
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton aspect-[3/4] !rounded-3xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="mb-6 grid size-24 place-items-center rounded-full bg-brand-soft"
          >
            <Heart className="size-10" />
          </motion.div>
          <p className="font-display text-3xl">Nothing saved yet</p>
          <p className="mt-2 text-ink-soft">Tap the heart on any serum to save it here.</p>
          <ButtonLink href="/shop" className="mt-8">Discover serums</ButtonLink>
        </div>
      ) : (
        <motion.ul layout className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          <AnimatePresence>
            {items.map((p) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="ring-brand group relative rounded-[1.75rem] bg-white p-2.5"
              >
                <button
                  onClick={() => remove(p.id)}
                  aria-label="Remove from wishlist"
                  className="absolute right-5 top-5 z-10 grid size-8 place-items-center rounded-full bg-white/90 shadow transition hover:rotate-90 hover:bg-ink hover:text-white"
                >
                  <X className="size-4" />
                </button>
                <Link href={`/product/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-[1.35rem] bg-sand">
                  <Image src={p.image} alt={p.name} fill sizes="25vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                </Link>
                <div className="p-3">
                  <Link href={`/product/${p.slug}`} className="font-display text-lg leading-snug hover:underline">
                    {p.name.replace(/^Dermisque\s+/i, "")}
                  </Link>
                  <p className="mt-1 font-semibold">{formatPrice(p.price)}</p>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      add(p);
                      remove(p.id);
                      toast.success("Moved to your bag");
                    }}
                  >
                    <ShoppingBag className="size-3.5" /> Move to bag
                  </Button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
