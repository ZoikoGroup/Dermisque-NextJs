/** Footer / site-map link groups. Every href points at a real page. */

export type LinkItem = { label: string; href: string; chat?: boolean };
export type LinkGroup = { title: string; links: LinkItem[] };

export const SHOP: LinkGroup = {
  title: "Shop",
  links: [
    { label: "All Products", href: "/shop" },
    { label: "Face Serums", href: "/collections/face-serums" },
    { label: "Hair Care", href: "/collections/hair-scalp" },
    { label: "Eye Care", href: "/collections/eye-care" },
    { label: "Top Rated", href: "/collections/top-rated" },
    { label: "Black Friday Offers", href: "/black-friday" },
    { label: "View All Collections", href: "/collections" },
  ],
};

export const CONSULT: LinkGroup = {
  title: "Consultation & Advice",
  links: [
    { label: "Free Skin Consultation", href: "/consultation" },
    { label: "Free Skin Assessment", href: "/skin-assessment" },
    { label: "Talk to a Product Expert", href: "/contact", chat: true },
  ],
};

export const LOWER: LinkGroup[] = [
  {
    title: "Company",
    links: [
      { label: "Home", href: "/" },
      { label: "About Us", href: "/about" },
      { label: "Our Story", href: "/about#our-story" },
      { label: "Contact Us", href: "/contact" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Journal & Education",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Skincare Routines", href: "/blog?category=Routines" },
      { label: "Ingredient Insights", href: "/blog?category=Ingredients" },
      { label: "Skin Concerns", href: "/blog?category=Skin%20Concerns" },
      { label: "Hair Care Tips", href: "/blog?category=Hair%20Care" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { label: "My Account", href: "/account" },
      { label: "Track Order", href: "/account/orders" },
      { label: "FAQs", href: "/faqs" },
      { label: "Shipping Policy", href: "/policies/shipping" },
      { label: "Replacement Policy", href: "/policies/replacement" },
      { label: "Contact Support", href: "/contact" },
    ],
  },
  {
    title: "Policies & Legal",
    links: [
      { label: "Privacy Policy", href: "/policies/privacy" },
      { label: "Terms of Use", href: "/policies/terms" },
      { label: "Cookie Policy", href: "/policies/cookies" },
      { label: "Accessibility", href: "/policies/accessibility" },
      { label: "Site Map", href: "/site-map" },
    ],
  },
];
