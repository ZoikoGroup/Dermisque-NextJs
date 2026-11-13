import { site } from "./site";

export type AppliedCoupon = { code: string; type: string; value: number; minOrder: number };

/**
 * Mirrors backend/app/pricing.py for instant display in the cart & checkout.
 * The backend recomputes totals when the order is placed — that figure is what's charged.
 */
export function computeTotals(subtotal: number, coupon?: AppliedCoupon | null) {
  let discount = 0;
  if (coupon && subtotal >= coupon.minOrder) {
    discount =
      coupon.type === "PERCENT"
        ? Math.round((subtotal * coupon.value) / 100)
        : Math.min(coupon.value, subtotal);
  }
  const shipping = subtotal === 0 || subtotal >= site.freeShippingThreshold ? 0 : site.flatShipping;
  const tax = Math.round((subtotal - discount) * site.taxRate);
  return { subtotal, discount, shipping, tax, total: subtotal - discount + shipping + tax };
}
