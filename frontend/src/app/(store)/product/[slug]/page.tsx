import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight, Leaf, RotateCcw, Truck } from "lucide-react";
import { Gallery } from "@/components/product/gallery";
import { ProductCard } from "@/components/product/product-card";
import { ProductTabs } from "@/components/product/product-tabs";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ReviewForm } from "@/components/product/review-form";
import { SectionHeading, Stars } from "@/components/ui/misc";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { getSession } from "@/lib/auth";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { FreeShippingText, Price } from "@/components/store/currency-provider";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  return {
    title: p.name,
    description: p.tagline ?? p.description.slice(0, 150),
    openGraph: { images: [p.image] },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const [product, session] = await Promise.all([getProductBySlug(slug), getSession()]);
  if (!product) notFound();
  const related = await getRelatedProducts(slug, 4);

  const cartProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    stock: product.stock,
  };

  return (
    <div className="pb-24 lg:pb-0">
      <div className="container-luxe pt-8">
        <nav className="flex items-center gap-1.5 text-xs text-mute" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">Home</Link>
          <ChevronRight className="size-3" />
          <Link href="/shop" className="hover:text-ink">Shop</Link>
          {product.categories[0] && (
            <>
              <ChevronRight className="size-3" />
              <Link href={`/shop?concern=${product.categories[0].slug}`} className="hover:text-ink">
                {product.categories[0].name}
              </Link>
            </>
          )}
        </nav>
      </div>

      <section className="container-luxe grid gap-10 py-8 lg:grid-cols-2 lg:gap-16">
        <Gallery images={product.gallery.length ? product.gallery : [product.image]} name={product.name} />

        <Reveal>
          <div className="flex flex-wrap gap-2">
            {product.categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop?concern=${c.slug}`}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs transition hover:border-ink"
              >
                {c.name}
              </Link>
            ))}
          </div>
          <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">{product.name}</h1>
          {product.tagline && <p className="mt-3 text-lg text-ink-soft">{product.tagline}</p>}

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <span className="text-3xl font-semibold"><Price cents={product.price} /></span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-lg text-mute line-through"><Price cents={product.compareAtPrice} /></span>
            )}
            <span className="text-xs text-mute">incl. taxes</span>
            {product.reviewCount > 0 && (
              <a href="#reviews" className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
                <Stars value={product.rating} /> {product.rating.toFixed(1)} ({product.reviewCount})
              </a>
            )}
          </div>
          {product.size && <p className="mt-2 text-sm text-mute">Size: {product.size} · All skin types</p>}

          <p className="mt-6 leading-relaxed text-ink-soft">{product.description}</p>

          {product.benefits.length > 0 && (
            <div className="mt-6 rounded-3xl bg-brand-soft p-5">
              <p className="eyebrow mb-3">Helps to</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {product.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-teal" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <PurchasePanel product={cartProduct} />

          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-line pt-6 text-center text-xs text-ink-soft">
            {[
              { icon: Truck, t: "Free shipping over {amount}" },
              { icon: RotateCcw, t: "Delivery in 2–7 days" },
              { icon: Leaf, t: "Cruelty-free" },
            ].map(({ icon: Icon, t }) => (
              <div key={t} className="group flex flex-col items-center gap-2">
                <Icon className="size-5 transition-transform duration-500 group-hover:-translate-y-1 group-hover:text-sun" />
                {t.includes("{amount}") ? <FreeShippingText template={t} /> : t}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="container-luxe py-12">
        <ProductTabs product={product} />
      </section>

      <section id="reviews" className="container-luxe scroll-mt-24 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading eyebrow="Reviews" title="What customers say" />
            {product.reviewCount > 0 && (
              <div className="mt-6 flex items-center gap-4">
                <span className="font-display text-6xl">{product.rating.toFixed(1)}</span>
                <div>
                  <Stars value={product.rating} size={18} />
                  <p className="mt-1 text-sm text-mute">Based on {product.reviewCount} reviews</p>
                </div>
              </div>
            )}
            <div className="mt-8">
              <ReviewForm slug={product.slug} signedIn={!!session} />
            </div>
          </div>
          <div className="space-y-4">
            {product.reviews.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center text-ink-soft">
                No reviews yet — be the first to share your experience.
              </div>
            ) : (
              product.reviews.map((r) => (
                <article key={r.id} className="rounded-3xl bg-white p-6">
                  <div className="flex items-center justify-between gap-4">
                    <Stars value={r.rating} />
                    <span className="text-xs text-mute">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.title && <p className="mt-3 font-medium">{r.title}</p>}
                  <p className="mt-2 text-ink-soft">{r.body}</p>
                  <p className="mt-4 text-sm font-medium">— {r.userName}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-luxe py-12">
          <SectionHeading eyebrow="Pairs well with" title="You may also like" />
          <Stagger className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}
    </div>
  );
}
