"use client";

import { usePrice } from "@/components/store/currency-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { Heart, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { QtyStepper } from "@/components/store/cart-drawer";
import { Button } from "@/components/ui/button";
import { useCart, type CartProduct } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

export function PurchasePanel({ product }: { product: CartProduct }) {
  const formatPrice = usePrice();
  const router = useRouter();
  const mounted = useMounted();
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);
  const toggle = useWishlist((s) => s.toggle);
  const wished = useWishlist((s) => s.items.some((i) => i.id === product.id));
  const soldOut = product.stock <= 0;
  const low = product.stock > 0 && product.stock <= 10;

  return (
    <>
      <div className="mt-8 space-y-4">
        <p className={cn("flex items-center gap-2 text-sm", soldOut ? "text-red-600" : low ? "text-[#a15c00]" : "text-emerald-700")}>
          <span className="relative flex size-2">
            <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", soldOut ? "bg-red-500" : low ? "bg-amber" : "bg-emerald-500")} />
            <span className={cn("relative inline-flex size-2 rounded-full", soldOut ? "bg-red-500" : low ? "bg-amber" : "bg-emerald-500")} />
          </span>
          {soldOut ? "Out of stock" : low ? `Only ${product.stock} left — order soon` : "In stock, ready to ship"}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <QtyStepper value={qty} onChange={(v) => setQty(Math.max(1, v))} max={product.stock} size="lg" />
          <Button
            size="lg"
            className="flex-1"
            disabled={soldOut}
            onClick={() => {
              add(product, qty);
              toast.success("Added to your bag");
            }}
          >
            <ShoppingBag className="size-4" /> Add to bag · {formatPrice(product.price * qty)}
          </Button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              toggle(product);
              toast(wished ? "Removed from wishlist" : "Saved to wishlist ♡");
            }}
            aria-label="Toggle wishlist"
            className="grid size-14 place-items-center rounded-full border border-line bg-white transition hover:border-ink"
          >
            <Heart className={cn("size-5 transition", mounted && wished && "fill-sun text-sun")} />
          </motion.button>
        </div>
        <Button
          variant="brand"
          size="lg"
          className="w-full"
          disabled={soldOut}
          onClick={() => {
            add(product, qty);
            setOpen(false);
            router.push("/checkout");
          }}
        >
          <Zap className="size-4" /> Buy it now
        </Button>
      </div>

      {/* sticky mobile bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/90 p-3 backdrop-blur-xl lg:hidden">
        <Button
          size="lg"
          className="w-full"
          disabled={soldOut}
          onClick={() => {
            add(product, qty);
            toast.success("Added to your bag");
          }}
        >
          <ShoppingBag className="size-4" /> Add to bag · {formatPrice(product.price * qty)}
        </Button>
      </div>
    </>
  );
}
