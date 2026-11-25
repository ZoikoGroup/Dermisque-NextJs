import type { Metadata } from "next";
import Image from "@/components/ui/product-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Eye } from "lucide-react";
import { BlogCard } from "@/components/blog/blog-card";
import { Markdown } from "@/components/blog/markdown";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { ShareButtons } from "@/components/blog/share-buttons";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/misc";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { getBlogPost } from "@/lib/blog";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      type: "article",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined,
      publishedTime: post.publishedAt ?? undefined,
    },
  };
}

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dermisque.com").replace(/\/$/, "");
const absolute = (src: string) => (/^https?:\/\//.test(src) ? src : `${SITE}${src.startsWith("/") ? "" : "/"}${src}`);

/** The post's own schema.org JSON-LD, or an Article built from its fields when none was written. */
function schemaFor(post: NonNullable<Awaited<ReturnType<typeof getBlogPost>>>): string {
  if (post.schemaMarkup) return post.schemaMarkup;
  const url = `${SITE}/blog/${post.slug}`;
  const org = { "@type": "Organization", name: "Dermisque", url: `${SITE}/` };
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    image: post.coverImage ? absolute(post.coverImage) : undefined,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    inLanguage: "en-US",
    articleSection: post.category,
    keywords: post.tags.length ? post.tags : undefined,
    author: post.authorName && !/dermisque/i.test(post.authorName) ? { "@type": "Person", name: post.authorName } : org,
    publisher: { ...org, logo: { "@type": "ImageObject", url: `${SITE}/logo.png` } },
  });
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <article>
      <script
        type="application/ld+json"
        // "<" is escaped so text inside the JSON can never close the script tag
        dangerouslySetInnerHTML={{ __html: schemaFor(post).replace(/</g, "\\u003c") }}
      />
      <ReadingProgress />

      <header className="container-luxe pt-10">
        <Reveal>
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-ink-soft transition hover:-translate-x-0.5 hover:text-ink">
            <ArrowLeft className="size-4" /> All articles
          </Link>
          <div className="mx-auto mt-8 max-w-3xl text-center">
            <Link
              href={`/blog?category=${encodeURIComponent(post.category)}`}
              className="inline-block rounded-full bg-brand px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-ink transition hover:scale-105"
            >
              {post.category}
            </Link>
            <h1 className="mt-6 font-display text-4xl leading-[1.1] sm:text-6xl">{post.title}</h1>
            {post.excerpt && <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-soft">{post.excerpt}</p>}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-mute">
              <span className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
                  {post.authorName.charAt(0)}
                </span>
                <span className="font-medium text-ink">{post.authorName}</span>
              </span>
              {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
              <span className="flex items-center gap-1"><Clock className="size-3.5" /> {post.readingTime} min read</span>
              <span className="flex items-center gap-1"><Eye className="size-3.5" /> {post.views.toLocaleString()} views</span>
            </div>
          </div>
        </Reveal>
        {post.coverImage && (
          <Reveal delay={0.1}>
            <div className="relative mx-auto mt-10 aspect-[16/9] max-w-5xl overflow-hidden rounded-[2rem] bg-sand sm:rounded-[2.5rem]">
              <Image src={post.coverImage} alt={post.title} fill preload sizes="(min-width:1024px) 1024px, 100vw" className="object-cover" />
            </div>
          </Reveal>
        )}
      </header>

      <div className="container-luxe mt-12 grid gap-12 lg:grid-cols-[1fr_minmax(0,46rem)_1fr]">
        <div className="hidden lg:block" />
        <div>
          <Markdown>{post.content}</Markdown>

          {post.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm transition hover:border-ink hover:bg-ink hover:text-white">
                  #{t}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-y border-line py-6">
            <ShareButtons title={post.title} />
            <ButtonLink href="/consultation" variant="outline" size="sm">
              Get a free skin consultation
            </ButtonLink>
          </div>
        </div>
        <div className="hidden lg:block" />
      </div>

      {post.products.length > 0 && (
        <section className="mt-20 bg-white py-20">
          <div className="container-luxe">
            <SectionHeading eyebrow="Shop the article" title="Products mentioned" />
            <Stagger className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {post.products.map((p) => (
                <StaggerItem key={p.id}>
                  <ProductCard product={p} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {post.related.length > 0 && (
        <section className="container-luxe py-20">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading eyebrow="Keep reading" title="More from the journal" />
            <Link href="/blog" className="hidden text-sm font-medium hover:underline sm:block">View all</Link>
          </div>
          <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {post.related.map((r) => (
              <StaggerItem key={r.id}>
                <BlogCard post={r} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}
    </article>
  );
}
