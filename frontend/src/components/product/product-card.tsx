"use client";

import { usePrice } from "@/components/store/currency-provider";
import Image from "@/components/ui/product-image";
import Link from "next/link";
import { motion } from "motion/react";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useMounted } from "@/hooks/use-mounted";
import { Stars } from "@/components/ui/misc";
import type { ProductCardData } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const formatPrice = usePrice();
  const add = useCart((s) => s.add);
  const toggle = useWishlist((s) => s.toggle);
  const wished = useWishlist((s) => s.items.some((i) => i.id === product.id));
  const mounted = useMounted();
  const soldOut = product.stock <= 0;
  const cartItem = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    stock: product.stock,
  };
  const shortName = product.name.replace(/^Dermisque\s+/i, "");

  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="ring-brand group relative flex h-full flex-col rounded-[1.75rem] bg-white p-2.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgba(11,11,15,0.35)]"
    >
      <div className="relative aspect-square overflow-hidden rounded-[1.35rem] bg-sand">
        <Link href={`/product/${product.slug}`} aria-label={product.name} className="absolute inset-0 block">
          <Image
            src={product.image}
            alt={product.name}
            fill
            preload={priority}
            sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
            className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-luxe)] group-hover:scale-[1.08]"
          />
          {/* soft brand glow on hover */}
          <span className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </Link>

        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-ink">
            -{Math.round(100 - (product.price / product.compareAtPrice) * 100)}%
          </span>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white">
            Sold out
          </span>
        )}

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => {
              toggle(cartItem);
              toast(wished ? "Removed from wishlist" : "Saved to wishlist ♡");
            }}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={mounted && wished}
            className="grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110"
          >
            <Heart
              className={cn(
                "size-4 transition-all duration-300",
                mounted && wished ? "scale-110 fill-sun text-sun" : "text-ink",
              )}
            />
          </motion.button>
          <Link
            href={`/product/${product.slug}`}
            aria-label="View details"
            className="grid size-9 translate-x-12 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all duration-500 hover:scale-110 group-hover:translate-x-0"
          >
            <Eye className="size-4" />
          </Link>
        </div>

        {/* quick add – slides up on hover (always visible on touch) */}
        <div className="absolute inset-x-3 bottom-3 transition-all duration-500 ease-[var(--ease-luxe)] lg:translate-y-[130%] lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
          <button
            disabled={soldOut}
            onClick={() => {
              add(cartItem);
              toast.success(`${shortName} added to bag`);
            }}
            className="sheen flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-50"
          >
            <ShoppingBag className="size-4" /> {soldOut ? "Sold out" : "Quick add"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
        {product.concerns.length > 0 && (
          <p className="eyebrow mb-1.5 truncate !text-[0.62rem]">{product.concerns.slice(0, 2).join(" · ")}</p>
        )}
        <Link href={`/product/${product.slug}`} className="font-display text-lg leading-snug transition-colors">
          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
            {shortName}
          </span>
        </Link>
        {product.reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-mute">
            <Stars value={product.rating} size={12} /> ({product.reviewCount})
          </div>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-lg font-semibold">{formatPrice(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-mute line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-[1.75rem] bg-white p-2.5">
      <div className="skeleton aspect-square !rounded-[1.35rem]" />
      <div className="space-y-2 px-2 pb-2 pt-4">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-5 w-4/5" />
        <div className="skeleton h-5 w-1/4" />
      </div>
    </div>
  );
}
