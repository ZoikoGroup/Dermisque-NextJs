"use client";

import Image from "@/components/ui/product-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  Bold,
  Code,
  ExternalLink,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Info,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  Maximize2,
  MessageCircleQuestion,
  Minimize2,
  Minus,
  MousePointerClick,
  Quote,
  Redo2,
  Sparkles,
  SquareCode,
  Strikethrough,
  Table,
  Trash2,
  Undo2,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { deleteBlogPost, saveBlogPost, uploadImage, type BlogPayload } from "@/app/actions/admin";
import { Markdown } from "@/components/blog/markdown";
import { Button } from "@/components/ui/button";
import type { BlogPost, ProductCardData } from "@/lib/types";
import { cn, isFuture } from "@/lib/utils";

/** Toolbar buttons, in groups. "table" and "callout" open a small picker instead of acting at once. */
const TOOL_GROUPS = [
  [
    { key: "undo", icon: Undo2, label: "Undo (Ctrl+Z)" },
    { key: "redo", icon: Redo2, label: "Redo (Ctrl+Y)" },
  ],
  [
    { key: "h2", icon: Heading2, label: "Heading" },
    { key: "h3", icon: Heading3, label: "Subheading" },
    { key: "h4", icon: Heading4, label: "Small heading" },
  ],
  [
    { key: "bold", icon: Bold, label: "Bold (Ctrl+B)" },
    { key: "italic", icon: Italic, label: "Italic (Ctrl+I)" },
    { key: "strike", icon: Strikethrough, label: "Strikethrough" },
    { key: "code", icon: Code, label: "Inline code" },
  ],
  [
    { key: "ul", icon: List, label: "Bullet list" },
    { key: "ol", icon: ListOrdered, label: "Numbered list" },
    { key: "check", icon: ListChecks, label: "Checklist" },
    { key: "quote", icon: Quote, label: "Quote" },
  ],
  [
    { key: "link", icon: Link2, label: "Link (Ctrl+K)" },
    { key: "image", icon: ImagePlus, label: "Insert image (or paste / drop one)" },
    { key: "video", icon: Video, label: "YouTube video" },
    { key: "table", icon: Table, label: "Table" },
    { key: "button", icon: MousePointerClick, label: "Button link" },
    { key: "callout", icon: Info, label: "Note box" },
    { key: "faq", icon: MessageCircleQuestion, label: "FAQ section" },
    { key: "codeblock", icon: SquareCode, label: "Code block" },
    { key: "hr", icon: Minus, label: "Divider line" },
  ],
] as const;
type ToolKey = (typeof TOOL_GROUPS)[number][number]["key"];

const CALLOUTS = [
  { kind: "TIP", label: "Tip", dot: "bg-[#1f8a5b]" },
  { kind: "NOTE", label: "Note", dot: "bg-[#3b6fd8]" },
  { kind: "WARNING", label: "Good to know", dot: "bg-[#d98a00]" },
  { kind: "IMPORTANT", label: "Important", dot: "bg-[#b42318]" },
] as const;

const FAQ_TEMPLATE = `## Frequently asked questions

### First question?

Answer to the first question.

### Second question?

Answer to the second question.`;

const YOUTUBE_URL = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}/;

const tableMarkdown = (rows: number, cols: number) => {
  const head = Array.from({ length: cols }, (_, i) => `Heading ${i + 1}`);
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(head.map(() => "---")), ...Array.from({ length: rows }, () => line(head.map(() => "Text")))].join("\n");
};

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
  const placeholder = useRef<[number, number] | null>(null);

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
  /** Replaces start..end with text through the browser's editing, so Ctrl+Z / Undo still works. */
  const edit = (start: number, end: number, text: string, select?: [number, number]) => {
    const ta = contentRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(start, end);
    if (!document.execCommand("insertText", false, text)) {
      ta.setRangeText(text, start, end, "end"); // very old browsers: no undo, but the edit still lands
      setF((x) => ({ ...x, content: ta.value }));
    }
    const [a, b] = select ?? [start + text.length, start + text.length];
    ta.setSelectionRange(a, b);
  };
  const wrap = (before: string, after = before, placeholder = "text") => {
    const ta = contentRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const sel = value.slice(s, e) || placeholder;
    edit(s, e, before + sel + after, [s + before.length, s + before.length + sel.length]);
  };
  const linePrefix = (prefix: string | ((i: number) => string)) => {
    const ta = contentRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const lineEnd = value.indexOf("\n", e) < 0 ? value.length : value.indexOf("\n", e);
    // whole lines, so "- " goes in front of the line even when the cursor is in the middle of it
    const lines = value.slice(lineStart, lineEnd).split("\n").map((l, i) => (typeof prefix === "string" ? prefix : prefix(i)) + l);
    edit(lineStart, lineEnd, lines.join("\n"));
  };
  /** Inserts a block on its own lines (blank line before and after), optionally selecting part of it.
      `replace` uses the highlighted text's place; otherwise the block goes after the current block. */
  const insertBlock = (text: string, selectPart?: string, replace = false) => {
    const ta = contentRef.current;
    if (!ta) return;
    const { value } = ta;
    let { selectionStart: s, selectionEnd: e } = ta;
    if (!replace) {
      // after the whole current block (paragraph, table, list), so a table is never split in two
      const blockEnd = value.indexOf("\n\n", e);
      s = e = blockEnd < 0 ? value.length : blockEnd;
    }
    const before = value.slice(0, s);
    const after = value.slice(e);
    const pre = !before || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const post = after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    const full = pre + text + post;
    const i = selectPart ? full.indexOf(selectPart) : -1;
    const pick: [number, number] | undefined = selectPart && i >= 0 ? [s + i, s + i + selectPart.length] : undefined;
    edit(s, e, full, pick);
    placeholder.current = pick ?? null;
  };
  /** Highlighted text, ignoring a placeholder the toolbar itself just highlighted (e.g. "Heading 1"). */
  const selected = () => {
    const ta = contentRef.current;
    if (!ta) return "";
    const p = placeholder.current;
    if (p && ta.selectionStart === p[0] && ta.selectionEnd === p[1]) return "";
    return ta.value.slice(ta.selectionStart, ta.selectionEnd);
  };

  const [picker, setPicker] = useState<"table" | "callout" | null>(null);
  const [tableSize, setTableSize] = useState<[number, number]>([2, 2]);
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [full]);

  const runTool = (tool: ToolKey) => {
    setPicker(null);
    switch (tool) {
      case "undo":
      case "redo":
        contentRef.current?.focus();
        return void document.execCommand(tool);
      case "h2": return linePrefix("## ");
      case "h3": return linePrefix("### ");
      case "h4": return linePrefix("#### ");
      case "bold": return wrap("**");
      case "italic": return wrap("*");
      case "strike": return wrap("~~");
      case "code": return wrap("`", "`", "code");
      case "ul": return linePrefix("- ");
      case "ol": return linePrefix((i) => `${i + 1}. `);
      case "check": return linePrefix("- [ ] ");
      case "quote": return linePrefix("> ");
      case "link": return wrap("[", "](https://)", "link text");
      case "image": return inlineRef.current?.click();
      case "video": {
        const url = window.prompt("Paste the YouTube link (e.g. https://www.youtube.com/watch?v=...)")?.trim();
        if (!url) return;
        if (!YOUTUBE_URL.test(url)) return void toast.error("That doesn't look like a YouTube video link");
        return insertBlock(url);
      }
      case "table":
      case "callout":
        return setPicker(tool);
      case "button": {
        const sel = selected(); // highlighted text becomes the button label
        return insertBlock(`[${sel || "Shop now"}](/shop "button")`, "/shop", !!sel);
      }
      case "faq": return insertBlock(FAQ_TEMPLATE, "First question?");
      case "codeblock": {
        const sel = selected();
        return insertBlock("```\n" + (sel || "code") + "\n```", sel || "code", !!sel);
      }
      case "hr": return insertBlock("---");
    }
  };

  const insertTable = (rows: number, cols: number) => {
    setPicker(null);
    insertBlock(tableMarkdown(rows, cols), "Heading 1");
  };
  const insertCallout = (kind: string) => {
    setPicker(null);
    const sel = selected(); // highlighted text goes inside the box
    const text = sel || "Write the note here.";
    insertBlock(`> [!${kind}]\n> ${text.replace(/\n/g, "\n> ")}`, text.split("\n")[0], !!sel);
  };

  /** Uploads an image and puts it where the cursor is (toolbar, paste or drag-and-drop). */
  const uploadInline = async (file: File) => {
    setUploading(true);
    const res = await upload(file);
    setUploading(false);
    if (res.ok) insertBlock(`![${file.name.replace(/\.[^.]+$/, "").replace(/[[\]]/g, "")}](${res.data.url})`);
    else toast.error(res.error);
  };
  const imageFrom = (files: FileList | undefined) =>
    [...(files ?? [])].find((x) => /^image\/(jpeg|png|webp|avif)$/.test(x.type));

  const onEditorKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const k = e.key.toLowerCase();
    const tool = k === "b" ? "bold" : k === "i" ? "italic" : k === "k" ? "link" : null;
    if (tool) {
      e.preventDefault();
      runTool(tool);
    }
  };

  /** Fills the schema box with an Article (and FAQPage, from the post's FAQ section) for Google. */
  const buildSchema = () => {
    if (f.schemaMarkup.trim() && !window.confirm("Replace the schema markup that's already in the box?")) return;
    const site = "https://www.dermisque.com";
    const slug = f.slug.trim() || slugify(f.title);
    const url = `${site}/blog/${slug}`;
    const org = { "@type": "Organization", name: "Dermisque", url: `${site}/` };
    const date = (f.publishedAt ? new Date(f.publishedAt) : new Date()).toISOString().slice(0, 10);
    const graph: Record<string, unknown>[] = [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        url,
        headline: f.metaTitle.trim() || f.title.trim(),
        description: f.metaDescription.trim() || f.excerpt.trim() || undefined,
        image: f.coverImage ? (f.coverImage.startsWith("http") ? f.coverImage : `${site}${f.coverImage}`) : undefined,
        datePublished: date,
        dateModified: new Date().toISOString().slice(0, 10),
        inLanguage: "en-US",
        keywords: tags.length ? tags : undefined,
        author: org,
        publisher: org,
      },
    ];
    const faq = faqFrom(f.content);
    if (faq.length) {
      graph.push({
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        url,
        inLanguage: "en-US",
        mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      });
    }
    setF((x) => ({ ...x, schemaMarkup: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2) }));
    toast.success(faq.length ? `Schema built: Article + ${faq.length} FAQ question${faq.length > 1 ? "s" : ""}` : "Schema built: Article");
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
          if (file) await uploadInline(file);
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

          <section
            className={cn(
              "rounded-3xl bg-white",
              full && "fixed inset-2 z-[100] flex flex-col overflow-hidden shadow-2xl ring-1 ring-line sm:inset-4",
            )}
          >
            <div className="flex flex-wrap items-center gap-1 rounded-t-3xl border-b border-line bg-white px-3 py-2">
              {TOOL_GROUPS.map((group, gi) => (
                <div key={gi} className={cn("flex flex-wrap items-center gap-0.5", gi > 0 && "border-l border-line pl-1")}>
                  {group.map(({ icon: Icon, label, key }) => (
                    <div key={key} className="relative">
                      <button
                        type="button"
                        title={label}
                        aria-label={label}
                        aria-expanded={key === "table" || key === "callout" ? picker === key : undefined}
                        onMouseDown={(e) => e.preventDefault()} // keep the cursor/selection in the text
                        onClick={() => (picker === key ? setPicker(null) : runTool(key))}
                        disabled={mode === "preview"}
                        className={cn(
                          "grid size-8 place-items-center rounded-lg text-ink-soft transition hover:bg-ink hover:text-white disabled:opacity-30",
                          picker === key && "bg-ink text-white",
                        )}
                      >
                        <Icon className="size-4" />
                      </button>
                      {key === "table" && picker === "table" && (
                        <div className="absolute left-0 top-10 z-20 w-max rounded-2xl border border-line bg-white p-3 shadow-xl">
                          <p className="mb-2 text-xs text-mute">
                            Table: <span className="font-semibold text-ink">{tableSize[1]} columns × {tableSize[0]} rows</span> + header
                          </p>
                          <div className="grid grid-cols-6 gap-1" onMouseLeave={() => setTableSize([2, 2])}>
                            {Array.from({ length: 36 }, (_, i) => {
                              const r = Math.floor(i / 6) + 1;
                              const c = (i % 6) + 1;
                              const on = r <= tableSize[0] && c <= tableSize[1];
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  aria-label={`${c} columns, ${r} rows`}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onMouseEnter={() => setTableSize([r, c])}
                                  onFocus={() => setTableSize([r, c])}
                                  onClick={() => insertTable(r, c)}
                                  className={cn("size-5 rounded border transition", on ? "border-ink bg-ink/80" : "border-line bg-cream hover:border-ink")}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {key === "callout" && picker === "callout" && (
                        <div className="absolute left-0 top-10 z-20 w-44 rounded-2xl border border-line bg-white p-1.5 shadow-xl">
                          {CALLOUTS.map((c) => (
                            <button
                              key={c.kind}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => insertCallout(c.kind)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-cream"
                            >
                              <span className={cn("size-2.5 rounded-full", c.dot)} /> {c.label} box
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {uploading && <Loader2 className="ml-1 size-4 animate-spin text-mute" />}
              <button
                type="button"
                title={full ? "Exit full screen (Esc)" : "Full screen"}
                aria-label={full ? "Exit full screen" : "Full screen"}
                onClick={() => setFull((x) => !x)}
                className="ml-auto grid size-8 place-items-center rounded-lg text-ink-soft transition hover:bg-ink hover:text-white"
              >
                {full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
              <div className="flex rounded-full bg-cream p-1 text-xs">
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
            <div className={cn("grid", mode === "split" && "lg:grid-cols-2 lg:divide-x lg:divide-line", full && "min-h-0 flex-1")}>
              {mode !== "preview" && (
                <textarea
                  ref={contentRef}
                  value={f.content}
                  onChange={(e) => setF({ ...f, content: e.target.value })}
                  onKeyDown={onEditorKey}
                  onPaste={(e) => {
                    const img = imageFrom(e.clipboardData.files);
                    if (img) {
                      e.preventDefault();
                      void uploadInline(img);
                    }
                  }}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes("Files")) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    const img = imageFrom(e.dataTransfer.files);
                    if (img) {
                      e.preventDefault();
                      void uploadInline(img);
                    }
                  }}
                  placeholder={"Write your article in Markdown…\n\n## A heading\n\nSome **bold** text, a [link](https://dermisque.com) and a list:\n\n- First point\n- Second point"}
                  className={cn(
                    "w-full bg-transparent p-6 font-mono text-sm leading-relaxed outline-none",
                    full ? "h-full resize-none" : "min-h-[520px] resize-y",
                  )}
                />
              )}
              {mode !== "write" && (
                <div className={cn("overflow-y-auto bg-cream/40 p-6", full ? "h-full" : "max-h-[720px] min-h-[520px]")}>
                  {f.content.trim() ? <Markdown className="compact">{f.content}</Markdown> : <p className="text-mute">Nothing to preview yet.</p>}
                </div>
              )}
            </div>
            <div className="flex justify-between border-t border-line px-6 py-2 text-xs text-mute">
              <span>Ctrl+B bold · Ctrl+I italic · Ctrl+K link · paste or drop images to upload</span>
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
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="label !mb-0">Schema markup (JSON-LD, optional)</span>
                  <button
                    type="button"
                    onClick={buildSchema}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium transition hover:border-ink hover:bg-ink hover:text-white"
                  >
                    <Sparkles className="size-3.5" /> Build from this post
                  </button>
                </div>
                <p className="mb-1.5 mt-1 text-xs text-mute">
                  Makes an Article schema, plus an FAQ schema from the post&apos;s &quot;Frequently asked questions&quot; section (each ### question and its answer).
                </p>
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
              </div>
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

const slugify = (t: string) =>
  t.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Plain text from a bit of Markdown (for schema answers). */
const plain = (md: string) =>
  md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*(?:[-*+]|\d+\.|>)\s+/gm, "")
    .replace(/[*_~`#]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Questions (### headings) and answers from the post's FAQ section (a ## heading mentioning FAQ / questions). */
function faqFrom(content: string): { q: string; a: string }[] {
  const lines = content.split("\n");
  const start = lines.findIndex((l) => /^##\s+.*(faq|question)/i.test(l));
  if (start < 0) return [];
  const out: { q: string; a: string[] }[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break; // next section
    const q = /^###\s+(.+)/.exec(line);
    if (q) out.push({ q: plain(q[1]), a: [] });
    else if (out.length) out[out.length - 1].a.push(line);
  }
  return out.map(({ q, a }) => ({ q, a: plain(a.join("\n")) })).filter((x) => x.q && x.a);
}
