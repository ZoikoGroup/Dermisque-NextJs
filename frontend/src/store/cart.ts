"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  price: number; // cents
  image: string;
  stock: number;
};

export type CartItem = CartProduct & { quantity: number };

type CartState = {
  items: CartItem[];
  open: boolean;
  coupon: string | null;
  bump: number; // increments on add, drives the badge animation
  add: (p: CartProduct, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  setCoupon: (code: string | null) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      coupon: null,
      bump: 0,
      add: (p, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === p.id);
          const items = existing
            ? s.items.map((i) =>
                i.id === p.id
                  ? { ...i, quantity: Math.min(i.quantity + qty, p.stock || 99) }
                  : i,
              )
            : [...s.items, { ...p, quantity: Math.min(qty, p.stock || 99) }];
          return { items, open: true, bump: s.bump + 1 };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              i.id === id ? { ...i, quantity: Math.max(0, Math.min(qty, i.stock || 99)) } : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [], coupon: null }),
      setOpen: (open) => set({ open }),
      setCoupon: (coupon) => set({ coupon }),
    }),
    {
      name: "dq-cart",
      partialize: (s) => ({ items: s.items, coupon: s.coupon }),
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((n, i) => n + i.price * i.quantity, 0);
