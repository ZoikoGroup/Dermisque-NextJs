"use client";

import { useEffect, useRef } from "react";
import { getServerCart, saveServerCart } from "@/app/actions/store";
import { useCart, type CartItem } from "@/store/cart";

const key = (items: CartItem[]) => JSON.stringify(items.map((i) => [i.id, i.quantity]));

/**
 * Keeps a signed-in shopper's bag on the server (powers abandoned-cart reminder emails and
 * lets the bag follow them across devices). The local bag wins when it has items.
 */
export function CartSync() {
  const last = useRef<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const push = (items: CartItem[]) => {
      const k = key(items);
      if (k === last.current) return;
      last.current = k;
      void saveServerCart(items.map((i) => ({ id: i.id, quantity: i.quantity })));
    };

    const start = async () => {
      const local = useCart.getState().items;
      if (local.length === 0) {
        const remote = await getServerCart();
        if (cancelled) return;
        if (remote.length) {
          last.current = key(remote);
          useCart.setState({ items: remote });
        } else last.current = key([]);
      } else push(local);
    };

    const ready = () => void start();
    if (useCart.persist.hasHydrated()) ready();
    const offHydrate = useCart.persist.onFinishHydration(ready);

    const offChange = useCart.subscribe((s, prev) => {
      if (s.items === prev.items) return;
      clearTimeout(timer);
      timer = setTimeout(() => push(s.items), 1200);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      offHydrate();
      offChange();
    };
  }, []);

  return null;
}
