/** Curated collection pages (/collections/[slug]) linked from the nav dropdowns. */

export type CollectionSource =
  | { kind: "slugs"; slugs: string[] } // a hand-picked set, in this order
  | { kind: "exclude"; slugs: string[] } // everything except these
  | { kind: "concern"; concern: string } // a concern (category) slug
  | { kind: "sort"; sort: "rating" | "newest"; limit: number };

export type Collection = {
  slug: string;
  group: "Category" | "Routine" | "Discover";
  name: string;
  eyebrow: string;
  description: string;
  image: string;
  highlights: string[];
  tip: string;
  source: CollectionSource;
  /** Serums that pair well with a small collection, shown underneath it. */
  pairsWith?: string[];
};

const NON_FACE = ["under-eye-serum", "lip-serum", "hair-growth-serum"];

export const COLLECTIONS: Collection[] = [
  // ---- by category
  {
    slug: "face-serums",
    group: "Category",
    name: "Face Serums",
    eyebrow: "Shop by category",
    description:
      "Triple-action face serums that pair three complementary actives, for brighter, smoother, healthier-looking skin.",
    image: "/products/vitamin-c.webp",
    highlights: ["3 actives per formula", "Lightweight, fast-absorbing", "For every skin type"],
    tip: "Apply 3–4 drops to clean, slightly damp skin, then follow with moisturiser and SPF in the morning.",
    source: { kind: "exclude", slugs: NON_FACE },
  },
  {
    slug: "eye-care",
    group: "Category",
    name: "Eye Care",
    eyebrow: "Shop by category",
    description: "Targeted care for the delicate under-eye area: shadows, puffiness and that tired look.",
    image: "/products/under-eye.jpg",
    highlights: ["Cooling roller applicator", "Targets dark circles", "Gentle on thin skin"],
    tip: "Roll gently outwards from the inner corner, morning and night. Store in the fridge for an extra-cooling de-puff.",
    source: { kind: "slugs", slugs: ["under-eye-serum"] },
    pairsWith: ["vitamin-c-face-serum", "skin-hydrating-face-serum", "24kt-gold-serum"],
  },
  {
    slug: "lip-care",
    group: "Category",
    name: "Lip Care",
    eyebrow: "Shop by category",
    description: "Nourish, smooth and plump dry lips with a serum made for everyday wear.",
    image: "/products/lip-serum.webp",
    highlights: ["Softens dry, flaky lips", "Non-sticky finish", "Wear alone or under colour"],
    tip: "Apply a thin layer before bed and as needed through the day, especially in cold or dry weather.",
    source: { kind: "slugs", slugs: ["lip-serum"] },
    pairsWith: ["skin-hydrating-face-serum", "aloe-glow-face-serum", "vitamin-c-face-serum"],
  },
  {
    slug: "hair-scalp",
    group: "Category",
    name: "Hair & Scalp",
    eyebrow: "Shop by category",
    description: "Scalp-first care that supports fuller-looking, stronger hair from the root.",
    image: "/products/hair-growth.webp",
    highlights: ["Redensyl-powered formula", "Supports the hair root", "Lightweight, non-greasy"],
    tip: "Massage a few drops into a clean, dry scalp daily. Give it 8–12 weeks of consistent use to see results.",
    source: { kind: "slugs", slugs: ["hair-growth-serum"] },
    pairsWith: ["24kt-gold-serum", "vitamin-c-face-serum", "skin-hydrating-face-serum"],
  },

  // ---- by routine
  {
    slug: "brightening-radiance",
    group: "Routine",
    name: "Brightening & Radiance",
    eyebrow: "Shop by routine",
    description: "Revive a dull complexion and bring back a lit-from-within glow.",
    image: "/products/gluta-glow.webp",
    highlights: ["Vitamin C & glutathione", "Evens out dullness", "Daily glow boost"],
    tip: "Use brightening serums in the morning under SPF. Sunscreen protects the glow you're building.",
    source: { kind: "concern", concern: "dull-skin" },
  },
  {
    slug: "hydration",
    group: "Routine",
    name: "Hydration",
    eyebrow: "Shop by routine",
    description: "Deep, lasting moisture for a healthy, comfortable skin barrier.",
    image: "/products/skin-hydrating.png",
    highlights: ["Hyaluronic acid", "Plumps and soothes", "Barrier support"],
    tip: "Apply hydrating serums to damp skin and seal them in with a moisturiser to lock water in.",
    source: { kind: "concern", concern: "dryness" },
  },
  {
    slug: "visible-aging",
    group: "Routine",
    name: "Visible Aging",
    eyebrow: "Shop by routine",
    description: "Smooth the look of fine lines and support firmer, bouncier skin.",
    image: "/products/anti-aging.webp",
    highlights: ["Retinol & 24 KT Gold", "Smooths fine lines", "Firmer-looking skin"],
    tip: "Introduce retinol at night 2–3 times a week, then build up. Always wear SPF the next morning.",
    source: { kind: "concern", concern: "wrinkles" },
  },
  {
    slug: "even-tone",
    group: "Routine",
    name: "Even-Looking Tone",
    eyebrow: "Shop by routine",
    description: "Fade the look of dark spots and patches for a more even complexion.",
    image: "/products/dark-spot.webp",
    highlights: ["Alpha arbutin & kojic acid", "Fades marks", "Evens skin tone"],
    tip: "Tone-evening results build over 6–8 weeks. Consistency and daily SPF make the biggest difference.",
    source: { kind: "concern", concern: "pigmentation" },
  },

  // ---- discover
  {
    slug: "top-rated",
    group: "Discover",
    name: "Top Rated",
    eyebrow: "Discover",
    description: "The serums our customers rate the highest, all in one place.",
    image: "/products/gold-serum.jpg",
    highlights: ["Customer favourites", "Rated by real buyers", "Proven routines"],
    tip: "Not sure which one suits you? Take the free skin assessment for a routine matched to your skin.",
    source: { kind: "sort", sort: "rating", limit: 8 },
  },
  {
    slug: "new-arrivals",
    group: "Discover",
    name: "New Arrivals",
    eyebrow: "Discover",
    description: "The latest additions to the Dermisque collection.",
    image: "/products/aloe-glow.webp",
    highlights: ["Fresh formulas", "Same 3X philosophy", "Just landed"],
    tip: "Introduce one new serum at a time, every few days, so you can see what each one does for your skin.",
    source: { kind: "sort", sort: "newest", limit: 8 },
  },
];

export const getCollection = (slug: string) => COLLECTIONS.find((c) => c.slug === slug);
