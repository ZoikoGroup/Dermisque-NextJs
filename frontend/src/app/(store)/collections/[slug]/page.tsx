import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Lightbulb, SearchX } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { COLLECTIONS, getCollection, type Collection } from "@/lib/collections";
import { getProducts } from "@/lib/queries";
import type { ProductCardData } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const c = getCollection((await params).slug);
  return c ? { title: c.name, description: c.description } : { title: "Collection not found" };
}

async function load(c: Collection): Promise<{ products: ProductCardData[]; pairs: ProductCardData[] }> {
  const s = c.source;
  if (s.kind === "concern") return { products: await getProducts({ concern: s.concern }), pairs: [] };
  if (s.kind === "sort") return { products: (await getProducts({ sort: s.sort })).slice(0, s.limit), pairs: [] };
  const all = await getProducts();
  const bySlug = (slugs: string[]) => slugs.map((slug) => all.find((p) => p.slug === slug)).filter((p) => !!p);
  return {
    products: s.kind === "slugs" ? bySlug(s.slugs) : all.filter((p) => !s.slugs.includes(p.slug)),
    pairs: bySlug(c.pairsWith ?? []),
  };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  const c = getCollection((await params).slug);
  if (!c) notFound();
  const { products, pairs } = await load(c).catch(() => ({ products: [], pairs: [] }));
  const others = COLLECTIONS.filter((o) => o.slug !== c.slug);

  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(120deg,#f6ece0_0%,#efe0cc_50%,#e9eadb_100%)]">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-[420px] rounded-full bg-[#9db27a]/35 blur-[90px]" />
        <div className="container-luxe relative grid items-center gap-10 py-12 md:grid-cols-[1.2fr_1fr] lg:py-16">
          <Reveal>
            <nav className="text-xs text-ink-soft">
              <Link href="/shop" className="hover:text-[#0f3d35]">Shop</Link>
              <span className="mx-2 opacity-50">/</span>
              <Link href="/collections" className="hover:text-[#0f3d35]">Collections</Link>
              <span className="mx-2 opacity-50">/</span>
              <span className="text-ink">{c.name}</span>
            </nav>
            <p className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#1f7a6e]">{c.eyebrow}</p>
            <h1 className="mt-3 font-display text-5xl leading-tight text-[#0f3d35] sm:text-6xl">{c.name}</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">{c.description}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {c.highlights.map((h) => (
                <li
                  key={h}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#b8955a]/40 bg-white/70 px-3.5 py-1.5 text-sm text-[#0f3d35]"
                >
                  <Check className="size-3.5 text-[#b8955a]" /> {h}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="mx-auto w-full max-w-md">
            <div className="relative aspect-square animate-float overflow-hidden rounded-[2rem] border-[6px] border-white shadow-[0_40px_80px_-40px_rgba(60,40,10,0.55)]">
              <Image src={c.image} alt={c.name} fill priority sizes="(min-width:768px) 420px, 90vw" className="object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* products */}
      <section className="container-luxe py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl">
            {products.length} {products.length === 1 ? "serum" : "serums"}
          </h2>
          <Link href="/shop" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f3d35]">
            Browse all serums <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <SearchX className="size-10 text-mute" />
            <p className="mt-4 font-display text-2xl">Nothing here just yet</p>
            <ButtonLink href="/shop" className="mt-6">Shop all serums</ButtonLink>
          </div>
        ) : (
          <Stagger className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} priority={i < 4} />
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {/* routine tip */}
        <Reveal>
          <div className="mt-12 flex gap-4 rounded-3xl bg-[linear-gradient(100deg,#e3efe9_0%,#f4efe4_100%)] p-6 sm:p-8">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-[#0f3d35]">
              <Lightbulb className="size-5" />
            </span>
            <div>
              <p className="font-display text-xl text-[#0f3d35]">How to use</p>
              <p className="mt-1 leading-relaxed text-ink-soft">{c.tip}</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* pairs well with */}
      {pairs.length > 0 && (
        <section className="bg-white py-14">
          <div className="container-luxe">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[#1f7a6e]">Complete the routine</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">Pairs well with</h2>
            <Stagger className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
              {pairs.map((p) => (
                <StaggerItem key={p.id}>
                  <ProductCard product={p} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* other collections */}
      <section className="container-luxe py-14">
        <h2 className="font-display text-3xl">Explore more collections</h2>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/collections/${o.slug}`}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm transition hover:border-[#0f3d35] hover:bg-[#0f3d35] hover:text-white"
            >
              {o.name}
            </Link>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-3xl bg-[#0f3d35] p-7 text-white sm:flex-row sm:items-center sm:p-9">
          <div>
            <p className="font-display text-2xl">Not sure what your skin needs?</p>
            <p className="mt-1 text-white/75">Take our free 1-minute skin assessment for a personalised routine.</p>
          </div>
          <Link
            href="/skin-assessment"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#0f3d35] transition hover:bg-[#f3e6d0]"
          >
            Start the assessment <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
