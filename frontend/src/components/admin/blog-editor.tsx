"use client";

import Image from "@/components/ui/product-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  Bold,
  ExternalLink,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { deleteBlogPost, saveBlogPost, uploadImage, type BlogPayload } from "@/app/actions/admin";
import { Markdown } from "@/components/blog/markdown";
import { Button } from "@/components/ui/button";
import type { BlogPost, ProductCardData } from "@/lib/types";
import { cn, isFuture } from "@/lib/utils";

const TOOLS = [
  { key: "h2", icon: Heading2, label: "Heading" },
  { key: "h3", icon: Heading3, label: "Subheading" },
  { key: "bold", icon: Bold, label: "Bold" },
  { key: "italic", icon: Italic, label: "Italic" },
  { key: "link", icon: Link2, label: "Link" },
  { key: "ul", icon: List, label: "Bullet list" },
  { key: "ol", icon: ListOrdered, label: "Numbered list" },
  { key: "quote", icon: Quote, label: "Quote" },
  { key: "image", icon: ImagePlus, label: "Insert image" },
] as const;

const DEFAULT_CATEGORIES =["Skincare", "Ingredients", "Routines", "Skin Concerns", "Hair Care", "News"];

/** ISO → value for <input type="datetime-local"> in the admin's local time. */
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

async function upload(file: File) {
  const fd = new FormData();
  fd.set("file", file);
  return uploadImage(fd);
}

export function BlogEditor({
  post,
  products,
  categories,
}: {
  post?: BlogPost;
  products: ProductCardData[];
  categories: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const inlineRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const [f, setF] = useState({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    coverImage: post?.coverImage ?? "",
    category: post?.category ?? "Skincare",
    authorName: post?.authorName ?? "",
    featured: post?.featured ?? false,
    metaTitle: post?.metaTitle ?? "",
    metaDescription: post?.metaDescription ?? "",
    schemaMarkup: post?.schemaMarkup ?? "",
    publishedAt: toLocalInput(post?.publishedAt),
  });
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [productIds, setProductIds] = useState<string[]>(post?.productIds ?? []);
  const [mode, setMode] = useState<"write" | "preview" | "split">("write");

  const schemaError = checkSchema(f.schemaMarkup);

  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])];
  const words = f.content.trim() ? f.content.trim().split(/\s+/).length : 0;

  /* ── Markdown toolbar helpers ── */
  const wrap = (before: string, after = before, placeholder = "text") => {
    const ta = contentRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const sel = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    setF((x) => ({ ...x, content: next }));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  };
  const linePrefix = (prefix: string | ((i: number) => string)) => {
    const ta = contentRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const block = value.slice(lineStart, e) || "Item";
    const lines = block.split("\n").map((l, i) => (typeof prefix === "string" ? prefix : prefix(i)) + l);
    const next = value.slice(0, lineStart) + lines.join("\n") + value.slice(e);
    setF((x) => ({ ...x, content: next }));
    requestAnimationFrame(() => ta.focus());
  };
  const insertAtCursor = (text: string) => {
    const ta = contentRef.current;
    const pos = ta?.selectionStart ?? f.content.length;
    setF((x) => ({ ...x, content: x.content.slice(0, pos) + text + x.content.slice(pos) }));
  };

  const runTool = (tool: (typeof TOOLS)[number]["key"]) => {
    switch (tool) {
      case "h2": return linePrefix("## ");
      case "h3": return linePrefix("### ");
      case "bold": return wrap("**");
      case "italic": return wrap("*");
      case "link": return wrap("[", "](https://)", "link text");
      case "ul": return linePrefix("- ");
      case "ol": return linePrefix((i) => `${i + 1}. `);
      case "quote": return linePrefix("> ");
      case "image": return inlineRef.current?.click();
    }
  };

  const addTag = (raw: string) => {
    const t = raw.trim().replace(/^#/, "");
    if (t && !tags.some((x) => x.toLowerCase() === t.toLowerCase())) setTags([...tags, t]);
    setTagInput("");
  };

  const save = (status: "DRAFT" | "PUBLISHED") => {
    if (f.title.trim().length < 3) {
      titleRef.current?.focus();
      titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return toast.error("Type the post title in the big title box at the top (3+ characters)");
    }
    if (f.content.trim().length < 20) return toast.error("Write some content first (20+ characters)");
    if (schemaError) return toast.error(`Schema markup: ${schemaError}`);
    const payload: BlogPayload = {
      title: f.title.trim(),
      slug: f.slug.trim() || undefined,
      excerpt: f.excerpt.trim(),
      content: f.content,
      coverImage: f.coverImage,
      category: f.category.trim() || "Skincare",
      tags,
      authorName: f.authorName.trim() || undefined,
      status,
      featured: f.featured,
      metaTitle: f.metaTitle.trim() || null,
      metaDescription: f.metaDescription.trim() || null,
      schemaMarkup: f.schemaMarkup.trim() || null,
      productIds,
      publishedAt: f.publishedAt ? new Date(f.publishedAt).toISOString() : null,
    };
    start(async () => {
      const res = await saveBlogPost(payload, post?.id);
      if (!res.ok) return void toast.error(res.error);
      toast.success(status === "PUBLISHED" ? "Post published" : "Draft saved");
      if (!post) router.push(`/admin/blog/${res.data.id}`);
      else {
        setF((x) => ({ ...x, slug: res.data.slug }));
        router.refresh();
      }
    });
  };

  const isPublished = post?.status === "PUBLISHED";
  const scheduled = isFuture(f.publishedAt);

  return (
    <div className="space-y-6">
      {/* hidden file inputs */}
      <input
        ref={coverRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setUploading(true);
          const res = await upload(file);
          setUploading(false);
          if (res.ok) setF((x) => ({ ...x, coverImage: res.data.url }));
          else toast.error(res.error);
        }}
      />
      <input
        ref={inlineRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setUploading(true);
          const res = await upload(file);
          setUploading(false);
          if (res.ok) insertAtCursor(`\n![${file.name.replace(/\.[^.]+$/, "")}](${res.data.url})\n`);
          else toast.error(res.error);
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft className="size-4" /> All posts
        </Link>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {post && isPublished && (
            <Link href={`/blog/${post.slug}`} target="_blank" className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm hover:bg-ink hover:text-white">
              <ExternalLink className="size-4" /> View post
            </Link>
          )}
          {post && <DeleteBlogButton id={post.id} title={post.title} redirectTo="/admin/blog" />}
          <Button variant="outline" disabled={pending} onClick={() => save("DRAFT")}>
            {isPublished ? "Unpublish (draft)" : "Save draft"}
          </Button>
          <Button disabled={pending} onClick={() => save("PUBLISHED")}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isPublished ? "Update" : scheduled ? "Schedule" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        {/* main column */}
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6">
            <span className="label">Post title</span>
            <input
              ref={titleRef}
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
              placeholder="Type the post title here"
              className="w-full bg-transparent font-display text-3xl outline-none placeholder:text-mute/50 sm:text-4xl"
            />
            <span className="mt-4 block text-xs text-mute">Web address (made from the title; change it only if you need to)</span>
            <div className="mt-1 flex items-center gap-1 text-sm text-mute">
              <span>/blog/</span>
              <input
                value={f.slug}
                onChange={(e) => setF({ ...f, slug: e.target.value })}
                placeholder="auto-generated-from-title"
                className="min-w-0 flex-1 rounded-lg bg-cream px-2 py-1 font-mono text-xs text-ink outline-none"
              />
            </div>
            <label className="mt-5 block">
              <span className="label">Excerpt (shown on cards & search results)</span>
              <textarea
                value={f.excerpt}
                maxLength={500}
                onChange={(e) => setF({ ...f, excerpt: e.target.value })}
                className="input min-h-20"
                placeholder="A one- or two-sentence summary…"
              />
              <span className="mt-1 block text-right text-xs text-mute">{f.excerpt.length}/500</span>
            </label>
          </section>

          <section className="overflow-hidden rounded-3xl bg-white">
            <div className="flex flex-wrap items-center gap-1 border-b border-line px-3 py-2">
              {TOOLS.map(({ icon: Icon, label, key }) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  aria-label={label}
                  onClick={() => runTool(key)}
                  disabled={mode === "preview"}
                  className="grid size-9 place-items-center rounded-lg text-ink-soft transition hover:bg-ink hover:text-white disabled:opacity-30"
                >
                  <Icon className="size-4" />
                </button>
              ))}
              {uploading && <Loader2 className="ml-1 size-4 animate-spin text-mute" />}
              <div className="ml-auto flex rounded-full bg-cream p-1 text-xs">
                {(["write", "split", "preview"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn("rounded-full px-3 py-1.5 capitalize transition", mode === m ? "bg-ink text-white" : "hover:bg-white")}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className={cn("grid", mode === "split" && "lg:grid-cols-2 lg:divide-x lg:divide-line")}>
              {mode !== "preview" && (
                <textarea
                  ref={contentRef}
                  value={f.content}
                  onChange={(e) => setF({ ...f, content: e.target.value })}
                  placeholder={"Write your article in Markdown…\n\n## A heading\n\nSome **bold** text, a [link](https://dermisque.com) and a list:\n\n- First point\n- Second point"}
                  className="min-h-[520px] w-full resize-y bg-transparent p-6 font-mono text-sm leading-relaxed outline-none"
                />
              )}
              {mode !== "write" && (
                <div className="max-h-[720px] min-h-[520px] overflow-y-auto bg-cream/40 p-6">
                  {f.content.trim() ? <Markdown className="compact">{f.content}</Markdown> : <p className="text-mute">Nothing to preview yet.</p>}
                </div>
              )}
            </div>
            <div className="flex justify-between border-t border-line px-6 py-2 text-xs text-mute">
              <span>Markdown supported · images upload to your media library</span>
              <span>{words.toLocaleString()} words · ~{Math.max(1, Math.ceil(words / 220))} min read</span>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6">
            <h3 className="font-display text-lg">SEO</h3>
            <div className="mt-4 grid gap-4">
              <label>
                <span className="label">Meta title (defaults to post title)</span>
                <input className="input" maxLength={200} value={f.metaTitle} onChange={(e) => setF({ ...f, metaTitle: e.target.value })} />
              </label>
              <label>
                <span className="label">Meta description (defaults to excerpt)</span>
                <textarea className="input min-h-20" maxLength={300} value={f.metaDescription} onChange={(e) => setF({ ...f, metaDescription: e.target.value })} />
              </label>
              <label>
                <span className="label">Schema markup (JSON-LD, optional)</span>
                <textarea
                  className={cn("input min-h-40 font-mono text-xs leading-relaxed", schemaError && "!border-[#e5484d]")}
                  spellCheck={false}
                  value={f.schemaMarkup}
                  onChange={(e) => setF({ ...f, schemaMarkup: e.target.value })}
                  placeholder={'{\n  "@context": "https://schema.org",\n  "@graph": [ { "@type": "Article", ... }, { "@type": "FAQPage", ... } ]\n}'}
                />
                <span className={cn("mt-1 block text-xs", schemaError ? "text-[#b42318]" : "text-mute")}>
                  {schemaError ??
                    (f.schemaMarkup.trim()
                      ? "Valid JSON. It is added to this post's page for Google."
                      : "Leave empty and an Article schema is made automatically from the title, excerpt, cover image and dates.")}
                </span>
              </label>
              <div className="rounded-2xl border border-line p-4">
                <p className="text-xs text-mute">Search preview</p>
                <p className="mt-1 truncate text-lg text-[#1a0dab]">{(f.metaTitle || f.title || "Post title") + " | Dermisque"}</p>
                <p className="truncate text-xs text-emerald-700">dermisque.com/blog/{f.slug || "your-post"}</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{f.metaDescription || f.excerpt || "Your excerpt will appear here."}</p>
              </div>
            </div>
          </section>
        </div>

        {/* sidebar */}
        <div className="space-y-6 xl:sticky xl:top-24">
          <Card title="Publishing">
            <div className="mb-4 flex items-center gap-2 text-sm">
              Status:
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", !post ? "bg-zinc-100 text-zinc-600" : isPublished ? (scheduled ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700") : "bg-zinc-100 text-zinc-600")}>
                {!post ? "New" : isPublished ? (scheduled ? "Scheduled" : "Published") : "Draft"}
              </span>
            </div>
            <label className="block">
              <span className="label">Publish date (leave empty for now)</span>
              <input type="datetime-local" className="input" value={f.publishedAt} onChange={(e) => setF({ ...f, publishedAt: e.target.value })} />
            </label>
            <p className="mt-1 text-xs text-mute">Pick a future date to schedule the post.</p>
            <label className="mt-4 flex cursor-pointer items-center justify-between text-sm">
              Featured on the Journal
              <button
                type="button"
                role="switch"
                aria-checked={f.featured}
                onClick={() => setF({ ...f, featured: !f.featured })}
                className={cn("relative h-6 w-11 rounded-full transition-colors", f.featured ? "bg-ink" : "bg-line")}
              >
                <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", f.featured ? "left-[22px]" : "left-0.5")} />
              </button>
            </label>
            <label className="mt-4 block">
              <span className="label">Author name</span>
              <input className="input" value={f.authorName} onChange={(e) => setF({ ...f, authorName: e.target.value })} placeholder="Defaults to your name" />
            </label>
          </Card>

          <Card title="Cover image">
            {f.coverImage ? (
              <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl bg-sand">
                <Image src={f.coverImage} alt="" fill sizes="340px" className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink/50 opacity-0 transition group-hover:opacity-100">
                  <Button size="sm" variant="outline" onClick={() => coverRef.current?.click()}>Replace</Button>
                  <button type="button" onClick={() => setF({ ...f, coverImage: "" })} className="grid size-9 place-items-center rounded-full bg-white text-red-600" aria-label="Remove cover">
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverRef.current?.click()}
                className="grid aspect-[16/10] w-full place-items-center rounded-2xl border-2 border-dashed border-line text-mute transition hover:border-ink hover:text-ink"
              >
                {uploading ? <Loader2 className="size-6 animate-spin" /> : <span className="flex flex-col items-center gap-2 text-sm"><ImagePlus className="size-6" /> Upload cover</span>}
              </button>
            )}
            <input
              className="input mt-3 text-xs"
              placeholder="…or paste an image URL / path"
              value={f.coverImage}
              onChange={(e) => setF({ ...f, coverImage: e.target.value })}
            />
          </Card>

          <Card title="Category & tags">
            <input className="input" list="blog-cats" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
            <datalist id="blog-cats">
              {allCategories.map((c) => <option key={c} value={c} />)}
            </datalist>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allCategories.map((c) => (
                <button key={c} type="button" onClick={() => setF({ ...f, category: c })} className={cn("rounded-full border px-2.5 py-1 text-xs transition", f.category === c ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}>
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-white p-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-xs">
                  #{t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagInput);
                  } else if (e.key === "Backspace" && !tagInput && tags.length) setTags(tags.slice(0, -1));
                }}
                onBlur={() => tagInput && addTag(tagInput)}
                placeholder={tags.length ? "" : "Add tags, press Enter"}
                className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none"
              />
            </div>
          </Card>

          <Card title={`Shop the post (${productIds.length})`}>
            <p className="mb-3 text-xs text-mute">Selected products appear under the article.</p>
            <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {products.map((p) => {
                const on = productIds.includes(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setProductIds(on ? productIds.filter((x) => x !== p.id) : [...productIds, p.id])}
                      className={cn("flex w-full items-center gap-3 rounded-xl p-2 text-left text-sm transition", on ? "bg-ink text-white" : "hover:bg-cream")}
                    >
                      <span className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-sand">
                        <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />
                      </span>
                      <span className="line-clamp-1 flex-1">{p.name.replace(/^Dermisque\s+/i, "")}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6">
      <h3 className="mb-4 font-display text-lg">{title}</h3>
      {children}
    </section>
  );
}

export function DeleteBlogButton({ id, title, redirectTo }: { id: string; title: string; redirectTo?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Delete ${title}`}
      className="grid size-9 place-items-center rounded-full text-red-600 transition hover:bg-red-600 hover:text-white"
      onClick={() => {
        if (!confirm(`Delete "${title}" permanently?`)) return;
        start(async () => {
          const res = await deleteBlogPost(id);
          if (res.ok) {
            toast.success("Post deleted");
            if (redirectTo) router.push(redirectTo);
          } else toast.error(res.error);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}

/** null when the schema box is empty or holds valid JSON-LD, otherwise a short reason. */
function checkSchema(raw: string): string | null {
  const v = raw.replace(/<\/?script[^>]*>/gi, "").trim();
  if (!v) return null;
  try {
    const data: unknown = JSON.parse(v);
    if (typeof data !== "object" || data === null) return "must be a JSON object, like { \"@context\": \"https://schema.org\" }";
    return null;
  } catch (e) {
    return `not valid JSON (${e instanceof Error ? e.message : "check commas and quotes"})`;
  }
}
