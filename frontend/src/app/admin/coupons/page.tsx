import { CouponManager } from "@/components/admin/coupon-manager";
import { api } from "@/lib/api";
import type { Coupon } from "@/lib/types";

export const metadata = { title: "Coupons" };

export default async function Coupons() {
  const coupons = await api<Coupon[]>("/api/admin/coupons");
  return <CouponManager coupons={coupons} />;
}
