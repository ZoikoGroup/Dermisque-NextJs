import Image from "@/components/ui/product-image";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import type { BlogCard as Post } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

function Cover({ post, sizes, preload }: { post: Post; sizes: string; preload?: boolean }) {
  return post.coverImage ? (
    <Image
      src={post.coverImage}
      alt=""
      fill
      sizes={sizes}
      preload={preload}
      className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-luxe)] group-hover:scale-[1.07]"
    />
  ) : (
    <div className="absolute inset-0 grid place-items-center bg-brand-soft font-display text-7xl text-ink/10">Σ</div>
  );
}

function Meta({ post, light }: { post: Post; light?: boolean }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs", light ? "text-white/75" : "text-mute")}>
      {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
      <span className="flex items-center gap-1">
        <Clock className="size-3" /> {post.readingTime} min read
      </span>
    </div>
  );
}

export function BlogCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="ring-brand group flex h-full flex-col rounded-[1.75rem] bg-white p-2.5 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-30px_rgba(11,11,15,0.35)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.35rem] bg-sand">
        <Cover post={post} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[0.7rem] font-semibold backdrop-blur">
          {post.category}
        </span>
        <span className="absolute right-3 top-3 grid size-9 translate-y-2 place-items-center rounded-full bg-ink text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
        <Meta post={post} />
        <h3 className="mt-2 font-display text-xl leading-snug">
          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
            {post.title}
          </span>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{post.excerpt}</p>
        <p className="mt-auto pt-4 text-xs font-medium text-ink-soft">By {post.authorName}</p>
      </div>
    </Link>
  );
}

/** Large hero card for the featured / latest post. */
export function FeaturedBlogCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group relative block overflow-hidden rounded-[2.25rem] bg-ink">
      <div className="relative aspect-[4/5] sm:aspect-[21/9]">
        <Cover post={post} sizes="100vw" preload />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-0 bg-brand opacity-0 mix-blend-soft-light transition-opacity duration-700 group-hover:opacity-50" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10 lg:max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-ink">
            {post.featured ? "Featured" : "Latest"}
          </span>
          <span className="rounded-full border border-white/30 px-3 py-1 text-[0.7rem] font-medium">{post.category}</span>
        </div>
        <h2 className="font-display text-3xl leading-tight sm:text-5xl">{post.title}</h2>
        <p className="mt-3 line-clamp-2 max-w-2xl text-white/80">{post.excerpt}</p>
        <div className="mt-5 flex items-center gap-4">
          <Meta post={post} light />
          <span className="ml-auto flex items-center gap-2 text-sm font-medium sm:ml-4">
            Read article
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="rounded-[1.75rem] bg-white p-2.5">
      <div className="skeleton aspect-[16/10] !rounded-[1.35rem]" />
      <div className="space-y-2 px-3 pb-3 pt-5">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-6 w-4/5" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}
