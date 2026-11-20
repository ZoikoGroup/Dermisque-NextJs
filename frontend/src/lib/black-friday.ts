// Black Friday campaign — shapes from GET /api/promotions/black-friday plus page helpers.
import type { CartProduct } from "@/store/cart";

export const BF_PATH = "/black-friday";
export const BF_IMG = "/black-friday";

export type DealProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  regularPrice: number; // USD cents
  price: number; // Black Friday price, USD cents
  stock: number;
};

export type DealBundle = {
  id: string; // cart line id: "bundle:<key>"
  key: string;
  kind: "combo" | "gift";
  name: string;
  subtitle: string;
  image: string;
  badge: string | null;
  items: DealProduct[];
  regularPrice: number;
  price: number;
  stock: number;
};

export type BlackFriday = {
  live: boolean;
  startsAt: string;
  endsAt: string;
  singlePct: number;
  comboPct: number;
  products: DealProduct[];
  bundles: DealBundle[];
};

export type CampaignStatus = "upcoming" | "live" | "ended";

export function campaignStatus(c: Pick<BlackFriday, "startsAt" | "endsAt">, now = Date.now()): CampaignStatus {
  if (now < Date.parse(c.startsAt)) return "upcoming";
  return now <= Date.parse(c.endsAt) ? "live" : "ended";
}

/** Studio packshots shot for the campaign (public/black-friday/products/<slug>.png). */
const PACKSHOTS = new Set([
  "vitamin-c-face-serum",
  "lip-serum",
  "skin-brightening-face-serum",
  "anti-aging-face-serum",
  "skin-hydrating-face-serum",
  "gluta-glow-face-serum",
  "aloe-glow-face-serum",
  "dark-spot-corrector-face-serum",
  "skin-exfoliating-face-serum",
  "hair-growth-serum",
  "anti-gray-hair-serum",
]);

export const dealImage = (p: Pick<DealProduct, "slug" | "image">) =>
  PACKSHOTS.has(p.slug) ? `${BF_IMG}/products/${p.slug}.png` : p.image;

/** Soft card tint that matches each serum's carton. */
const TINTS: Record<string, string> = {
  "vitamin-c-face-serum": "#fff8dc",
  "lip-serum": "#fbf3df",
  "skin-brightening-face-serum": "#f6f0fb",
  "anti-aging-face-serum": "#f1f5f8",
  "skin-hydrating-face-serum": "#eef6fb",
  "gluta-glow-face-serum": "#fdf1ea",
  "aloe-glow-face-serum": "#eef8ee",
  "dark-spot-corrector-face-serum": "#fff5e8",
  "skin-exfoliating-face-serum": "#f1f7e9",
  "hair-growth-serum": "#edf6fa",
  "anti-gray-hair-serum": "#f2f2f2",
};
export const dealTint = (slug: string) => TINTS[slug] ?? "#f7f3ec";

export type SerumType = "face" | "lip" | "hair";
export function serumType(slug: string): SerumType {
  if (slug.includes("lip")) return "lip";
  if (slug.includes("hair")) return "hair";
  return "face";
}
export const SERUM_LABEL: Record<SerumType, string> = { face: "Face serum", lip: "Lip serum", hair: "Hair serum" };

export const shortName = (name: string) => name.replace(/^Dermisque\s+/i, "");

export const productCartItem = (p: DealProduct): CartProduct => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  price: p.price,
  image: p.image,
  stock: p.stock,
});

export const bundleCartItem = (b: DealBundle): CartProduct => ({
  id: b.id,
  slug: b.key,
  name: `${b.name} (Black Friday set)`,
  price: b.price,
  image: b.image,
  stock: b.stock,
});

/** Where a bag line links to — bundles live on the campaign page. */
export const cartItemHref = (item: { id: string; slug: string }) =>
  item.id.startsWith("bundle:") ? `${BF_PATH}#combos` : `/product/${item.slug}`;

const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "Europe/London" });
const yearFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
});
/** "20 November" */
export const ukDay = (iso: string) => dayFmt.format(new Date(iso));
/** "20 November 2026" */
export const ukDate = (iso: string) => yearFmt.format(new Date(iso));
