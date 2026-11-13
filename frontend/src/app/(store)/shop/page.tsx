import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ShopFilters } from "@/components/shop/filters";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { getCategories, getProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Shop All Serums",
  description: "Shop Dermisque 3X skincare and hair care serums by concern.",
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const num = (k: string) => {
    const n = Number(str(k));
    return str(k) && Number.isFinite(n) ? n : undefined;
  };

  const filters = { q: str("q"), concern: str("concern"), sort: str("sort"), min: num("min"), max: num("max") };
  const [products, categories] = await Promise.all([getProducts(filters), getCategories()]);
  const current = categories.find((c) => c.slug === filters.concern);

  return (
    <div className="container-luxe pb-10 pt-12">
      <Reveal>
        <div className="mb-10 max-w-3xl">
          <p className="eyebrow mb-3">{current ? "Shop by concern" : "The collection"}</p>
          <h1 className="font-display text-5xl leading-tight sm:text-6xl">
            {current ? current.name : filters.q ? <>Results for “{filters.q}”</> : "All serums"}
          </h1>
          <p className="mt-4 text-ink-soft">
            {current?.description ??
              "Triple-action skincare and hair care serums, formulated with three complementary actives for visible results."}
          </p>
        </div>
      </Reveal>

      <Suspense>
        <ShopFilters concerns={categories} count={products.length} />
      </Suspense>

      {products.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <div className="mb-5 grid size-20 place-items-center rounded-full bg-brand-soft">
            <SearchX className="size-8" />
          </div>
          <p className="font-display text-3xl">No serums match</p>
          <p className="mt-2 text-mute">Try a different concern or clear your filters.</p>
          <ButtonLink href="/shop" className="mt-6">
            Clear filters
          </ButtonLink>
        </div>
      ) : (
        <Stagger
          key={JSON.stringify(filters)}
          className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4"
        >
          {products.map((p, i) => (
            <StaggerItem key={p.id}>
              <ProductCard product={p} priority={i < 4} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
