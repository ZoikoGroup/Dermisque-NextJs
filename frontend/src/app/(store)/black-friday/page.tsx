import type { Metadata } from "next";
import { BlackFridayHero } from "@/components/black-friday/hero";
import { ComboGrid } from "@/components/black-friday/combo-grid";
import { DealGrid } from "@/components/black-friday/deal-grid";
import { GiftSets } from "@/components/black-friday/gift-sets";
import { SaleWeekend } from "@/components/black-friday/sale-weekend";
import {
  CountdownSection,
  OfferTerms,
  RitualBundle,
  RitualSteps,
  SkinTypes,
} from "@/components/black-friday/sections";
import { getBlackFriday } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Black Friday — 40% off every serum",
  description:
    "Dermisque Black Friday to Cyber Monday: 40% off every 3X serum, 45% off serum combos and giftable sets.",
  openGraph: { images: ["/black-friday/hero-banner.webp"] },
};

export default async function BlackFridayPage() {
  const data = await getBlackFriday();
  return (
    <div className="bg-[#f6f2ec]">
      <BlackFridayHero data={data} />
      <DealGrid data={data} />
      <ComboGrid data={data} />
      <RitualBundle data={data} />
      <RitualSteps />
      <GiftSets data={data} />
      <SaleWeekend data={data} />
      <SkinTypes />
      <CountdownSection data={data} />
      <OfferTerms data={data} />
    </div>
  );
}
