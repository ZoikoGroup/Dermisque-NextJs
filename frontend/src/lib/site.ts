export const site = {
  name: "Dermisque",
  wordmark: "DΣRMISQUΣ",
  tagline: "Sum of Beauty",
  description:
    "Premium 3X skincare & hair care serums. Clinically inspired formulas with triple-action actives for glowing, healthy, younger-looking skin.",
  company: "Zoiko Healthcare Inc.",
  email: "support@dermisque.com",
  phones: [
    { label: "US Toll-free", value: "+1-800-699-4917" },
    { label: "US Headquarters", value: "+1-800-484-5574" },
    { label: "UK", value: "+44 330 088 8958" },
  ],
  addresses: [
    {
      label: "Headquarters",
      lines: ["1401 21st Street, Suite R", "Sacramento, CA 95811, USA"],
    },
    {
      label: "Florida",
      lines: ["12386 State Road 535 #302", "FL 32836, USA"],
    },
    {
      label: "United Kingdom",
      lines: ["Berkeley Suite, 35 Berkeley Square", "Mayfair, London W1J 5BF"],
    },
  ],
  socials: [
    { name: "Facebook", href: "https://www.facebook.com/Dermisque/" },
    { name: "Instagram", href: "https://www.instagram.com/dermisque_official/" },
    { name: "X", href: "https://x.com/dermisque" },
    { name: "Pinterest", href: "https://www.pinterest.co.uk/dermisque/" },
    { name: "LinkedIn", href: "https://www.linkedin.com/company/dermisque/" },
    { name: "YouTube", href: "https://www.youtube.com/@Dermisque" },
  ],
  freeShippingThreshold: 1500, // cents ($15)
  flatShipping: 499, // cents
  taxRate: 0, // prices include taxes
};

export const concerns = [
  { name: "Dull Skin", slug: "dull-skin" },
  { name: "Wrinkles", slug: "wrinkles" },
  { name: "Acne", slug: "acne" },
  { name: "Dryness", slug: "dryness" },
  { name: "Dark Spots", slug: "dark-spots" },
  { name: "Sun Damaged Skin", slug: "sun-damage" },
  { name: "Dark Circles", slug: "dark-circles" },
  { name: "Hair Loss", slug: "hair-loss" },
  { name: "Pigmentation", slug: "pigmentation" },
];

export const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
