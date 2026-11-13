"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartProduct } from "./cart";

type WishlistState = {
  items: CartProduct[];
  toggle: (p: CartProduct) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (p) =>
        set((s) => ({
          items: s.items.some((i) => i.id === p.id)
            ? s.items.filter((i) => i.id !== p.id)
            : [...s.items, p],
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      has: (id) => get().items.some((i) => i.id === id),
    }),
    { name: "dq-wishlist" },
  ),
);
