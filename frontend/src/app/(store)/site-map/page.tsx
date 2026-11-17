import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { COLLECTIONS } from "@/lib/collections";
import { getProducts } from "@/lib/queries";
import { concerns } from "@/lib/site";
import { CONSULT, LOWER, SHOP, type LinkGroup } from "@/lib/site-links";

export const metadata = {
  title: "Site Map",
  description: "Every page on the Dermisque website in one place.",
};

export default async function SiteMapPage() {
  const products = await getProducts().catch(() => []);
  const groups: LinkGroup[] = [
    SHOP,
    { title: "Collections", links: COLLECTIONS.map((c) => ({ label: c.name, href: `/collections/${c.slug}` })) },
    { title: "Shop by Concern", links: concerns.map((c) => ({ label: c.name, href: `/shop?concern=${c.slug}` })) },
    { title: "Products", links: products.map((p) => ({ label: p.name.replace(/^Dermisque\s+/, ""), href: `/product/${p.slug}` })) },
    { ...CONSULT, links: CONSULT.links.filter((l) => !l.chat) },
    ...LOWER,
  ];

  return (
    <div className="container-luxe py-14 sm:py-16">
      <Reveal className="max-w-2xl">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#1f7a6e]">Site map</p>
        <h1 className="mt-3 font-display text-5xl text-[#0f3d35] sm:text-6xl">Every page, in one place</h1>
      </Reveal>
      <div className="mt-12 columns-1 gap-10 sm:columns-2 lg:columns-3">
        {groups.map((g) => (
          <section key={g.title} className="mb-10 break-inside-avoid">
            <h2 className="border-b border-line pb-2 font-display text-2xl text-[#0f3d35]">{g.title}</h2>
            <ul className="mt-3 space-y-2 text-ink-soft">
              {g.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition-colors hover:text-[#0f3d35] hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
