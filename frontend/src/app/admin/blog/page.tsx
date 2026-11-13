import Image from "@/components/ui/product-image";
import Link from "next/link";
import { Eye, Pencil, Plus, Star } from "lucide-react";
import { DeleteBlogButton } from "@/components/admin/blog-editor";
import { ButtonLink } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { BlogCard } from "@/lib/types";
import { cn, formatDate, isFuture } from "@/lib/utils";

export const metadata = { title: "Blog" };

export default async function AdminBlog({ searchParams }: PageProps<"/admin/blog">) {
  const { q } = await searchParams;
  const posts = await api<BlogCard[]>("/api/admin/blog", { query: { q: typeof q === "string" ? q : undefined } });
  const state = (p: BlogCard) =>
    p.status === "DRAFT"
      ? { label: "Draft", tone: "bg-zinc-100 text-zinc-600" }
      : isFuture(p.publishedAt)
        ? { label: "Scheduled", tone: "bg-indigo-100 text-indigo-700" }
        : { label: "Published", tone: "bg-emerald-100 text-emerald-700" };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <form action="/admin/blog" className="w-full sm:w-72">
          <input name="q" defaultValue={typeof q === "string" ? q : ""} placeholder="Search posts…" className="input !rounded-full" />
        </form>
        <p className="text-sm text-mute">{posts.length} posts</p>
        <ButtonLink href="/admin/blog/new" className="ml-auto">
          <Plus className="size-4" /> New post
        </ButtonLink>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-3xl bg-white p-16 text-center">
          <p className="font-display text-2xl">No posts yet</p>
          <p className="mt-2 text-mute">Write your first article — it will appear on the Journal page once published.</p>
          <ButtonLink href="/admin/blog/new" className="mt-6"><Plus className="size-4" /> Write a post</ButtonLink>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-mute">
              <tr>
                <th className="px-6 py-4 font-medium">Post</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Published</th>
                <th className="px-6 py-4 text-right font-medium">Views</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {posts.map((p) => {
                const s = state(p);
                return (
                  <tr key={p.id} className="transition hover:bg-cream">
                    <td className="px-6 py-3">
                      <Link href={`/admin/blog/${p.id}`} className="group flex items-center gap-3">
                        <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                          {p.coverImage && <Image src={p.coverImage} alt="" fill sizes="64px" className="object-cover transition-transform duration-500 group-hover:scale-110" />}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-medium group-hover:underline">
                            <span className="line-clamp-1">{p.title}</span>
                            {p.featured && <Star className="size-3.5 shrink-0 fill-amber text-amber" aria-label="Featured" />}
                          </span>
                          <span className="text-xs text-mute">/{p.slug} · {p.readingTime} min · by {p.authorName}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-3">{p.category}</td>
                    <td className="px-6 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", s.tone)}>{s.label}</span>
                    </td>
                    <td className="px-6 py-3 text-ink-soft">{p.publishedAt ? formatDate(p.publishedAt) : "—"}</td>
                    <td className="px-6 py-3 text-right tabular-nums">{p.views.toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-1">
                        {s.label === "Published" && (
                          <Link href={`/blog/${p.slug}`} target="_blank" className="grid size-9 place-items-center rounded-full transition hover:bg-ink hover:text-white" aria-label="View post">
                            <Eye className="size-4" />
                          </Link>
                        )}
                        <Link href={`/admin/blog/${p.id}`} className="grid size-9 place-items-center rounded-full transition hover:bg-ink hover:text-white" aria-label="Edit">
                          <Pencil className="size-4" />
                        </Link>
                        <DeleteBlogButton id={p.id} title={p.title} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
