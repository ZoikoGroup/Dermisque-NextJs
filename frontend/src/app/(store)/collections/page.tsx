import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { COLLECTIONS, type Collection } from "@/lib/collections";

export const metadata = {
  title: "Collections",
  description: "Browse Dermisque serums by category, routine and customer favourites.",
};

const GROUPS: { key: Collection["group"]; title: string }[] = [
  { key: "Category", title: "Shop by category" },
  { key: "Routine", title: "Shop by routine" },
  { key: "Discover", title: "Discover" },
];

export default function CollectionsPage() {
  return (
    <div className="container-luxe py-14 sm:py-16">
      <Reveal className="max-w-2xl">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#1f7a6e]">Product discovery</p>
        <h1 className="mt-3 font-display text-5xl leading-tight text-[#0f3d35] sm:text-6xl">Collections</h1>
        <p className="mt-4 text-lg text-ink-soft">Find your next serum by product, routine, or skin and hair care need.</p>
      </Reveal>

      {GROUPS.map((g) => (
        <section key={g.key} className="mt-14">
          <h2 className="font-display text-3xl">{g.title}</h2>
          <Stagger className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {COLLECTIONS.filter((c) => c.group === g.key).map((c) => (
              <StaggerItem key={c.slug}>
                <Link href={`/collections/${c.slug}`} className="group block overflow-hidden rounded-3xl border border-line bg-white">
                  <span className="relative block aspect-[4/3] overflow-hidden">
                    <Image
                      src={c.image}
                      alt=""
                      fill
                      sizes="(min-width:1024px) 300px, 45vw"
                      className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-luxe)] group-hover:scale-110"
                    />
                  </span>
                  <span className="flex items-center justify-between gap-2 p-4">
                    <span className="font-semibold text-[#0f3d35]">{c.name}</span>
                    <ArrowRight className="size-4 shrink-0 text-[#b8955a] transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      ))}
    </div>
  );
}
