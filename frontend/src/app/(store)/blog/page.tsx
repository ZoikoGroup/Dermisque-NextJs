import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, SearchX } from "lucide-react";
import { BlogCard, FeaturedBlogCard } from "@/components/blog/blog-card";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { getBlogCategories, getBlogPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "The Journal — Skincare Tips & Ingredient Guides",
  description: "Skincare routines, ingredient deep-dives and expert tips from the Dermisque team.",
};

const PAGE_SIZE = 9;

export default async function BlogIndex({ searchParams }: PageProps<"/blog">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const category = str("category");
  const tag = str("tag");
  const q = str("q");
  const page = Math.max(1, Number(str("page")) || 1);
  const filtering = Boolean(category || tag || q);

  const [data, categories] = await Promise.all([
    getBlogPosts({ category, tag, q, page, pageSize: PAGE_SIZE }),
    getBlogCategories(),
  ]);

  const showHero = !filtering && page === 1 && data.items.length > 0;
  const [hero, ...rest] = data.items;
  const grid = showHero ? rest : data.items;
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const href = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ category, tag, q, page, ...patch }))
      if (v !== undefined && v !== "" && !(k === "page" && v === 1)) p.set(k, String(v));
    return `/blog${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="container-luxe py-12">
      <Reveal>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">The Dermisque journal</p>
            <h1 className="mt-3 font-display text-5xl leading-tight sm:text-6xl">
              {tag ? <>#{tag}</> : category ?? (q ? <>Results for “{q}”</> : <>Skin, <span className="text-brand italic">decoded.</span></>)}
            </h1>
            <p className="mt-4 text-ink-soft">
              Ingredient deep-dives, routines that work and honest advice from the Dermisque team.
            </p>
          </div>
          <form action="/blog" className="relative w-full md:w-80">
            {category && <input type="hidden" name="category" value={category} />}
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mute" />
            <input name="q" defaultValue={q} placeholder="Search articles…" className="input !rounded-full pl-10" />
          </form>
        </div>
      </Reveal>

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Blog categories">
        <Chip href={href({ category: undefined, tag: undefined, page: 1 })} active={!category && !tag}>
          All articles
        </Chip>
        {categories.map((c) => (
          <Chip key={c.name} href={href({ category: c.name, tag: undefined, page: 1 })} active={category?.toLowerCase() === c.name.toLowerCase()}>
            {c.name} <span className="ml-1 text-[0.7rem] opacity-50">{c.count}</span>
          </Chip>
        ))}
      </nav>

      {data.items.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <div className="mb-5 grid size-20 place-items-center rounded-full bg-brand-soft">
            <SearchX className="size-8" />
          </div>
          <p className="font-display text-3xl">{filtering ? "No articles found" : "Articles coming soon"}</p>
          <p className="mt-2 text-mute">{filtering ? "Try another category or search term." : "Check back shortly for skincare tips and guides."}</p>
          {filtering && <ButtonLink href="/blog" className="mt-6">View all articles</ButtonLink>}
        </div>
      ) : (
        <>
          {showHero && hero && (
            <Reveal className="mt-10">
              <FeaturedBlogCard post={hero} />
            </Reveal>
          )}
          {grid.length > 0 && (
            <Stagger key={href({})} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((p) => (
                <StaggerItem key={p.id}>
                  <BlogCard post={p} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
          {pages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3 text-sm">
              <Link href={href({ page: page - 1 })} aria-disabled={page <= 1} className={cn("grid size-11 place-items-center rounded-full bg-white transition hover:bg-ink hover:text-white", page <= 1 && "pointer-events-none opacity-40")}>
                <ChevronLeft className="size-4" />
              </Link>
              <span>Page {page} of {pages}</span>
              <Link href={href({ page: page + 1 })} aria-disabled={page >= pages} className={cn("grid size-11 place-items-center rounded-full bg-white transition hover:bg-ink hover:text-white", page >= pages && "pointer-events-none opacity-40")}>
                <ChevronRight className="size-4" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm transition-all duration-300",
        active ? "border-ink bg-ink text-white" : "border-line bg-white hover:-translate-y-0.5 hover:border-ink",
      )}
    >
      {children}
    </Link>
  );
}
