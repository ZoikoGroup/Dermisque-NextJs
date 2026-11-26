"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  FileText,
  Heading,
  Image as ImageIcon,
  List,
  Loader2,
  Table,
  Type,
  UploadCloud,
  X,
} from "lucide-react";
import { uploadImage } from "@/app/actions/admin";
import { Markdown } from "@/components/blog/markdown";
import { Button } from "@/components/ui/button";
import { DOC_IMAGE, readDocx, type DocDraft } from "@/lib/docx-import";
import { cn } from "@/lib/utils";

export type DocImportResult = {
  content: string;
  mode: "replace" | "append";
  title?: string;
  excerpt?: string;
  coverImage?: string;
};

type Step = { kind: "pick" } | { kind: "reading"; name: string } | { kind: "review"; name: string; draft: DocDraft } | { kind: "importing"; done: number; total: number };

const IMG_LINK = /!\[[^\]]*\]\(\/__doc-image\/(\d+)\)/g;

/**
 * "Import from Word": drop a .docx, see what was found (headings, tables, lists, pictures) with a live
 * preview, choose what to fill in, then pictures are uploaded and the post is filled in one go.
 */
export function DocImport({
  open,
  file,
  onClose,
  onImport,
  has,
}: {
  open: boolean;
  file?: File | null; // a .docx dropped straight onto the editor
  onClose: () => void;
  onImport: (r: DocImportResult) => void;
  has: { content: boolean; title: boolean; excerpt: boolean; cover: boolean };
}) {
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [opts, setOpts] = useState({ mode: "replace" as "replace" | "append", title: true, excerpt: true, cover: true });
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);

  const freeImages = () => {
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
  };

  const read = useCallback(
    async (f: File) => {
      setError(null);
      setStep({ kind: "reading", name: f.name });
      try {
        const draft = await readDocx(f);
        freeImages();
        urls.current = draft.images.flatMap((i) => (i ? [i.url] : []));
        setOpts({
          mode: has.content ? "append" : "replace",
          title: !has.title,
          excerpt: !has.excerpt && !!draft.excerpt,
          cover: !has.cover && draft.stats.images > 0,
        });
        setStep({ kind: "review", name: f.name, draft });
      } catch (e) {
        setError(e instanceof Error ? e.message : "This file couldn't be read.");
        setStep({ kind: "pick" });
      }
    },
    [has.content, has.title, has.excerpt, has.cover],
  );

  // a file dropped onto the editor starts straight away
  useEffect(() => {
    if (!open || !file) return;
    const t = setTimeout(() => void read(file)); // next tick; cancelled if the dialog closes first
    return () => clearTimeout(t);
  }, [open, file, read]);

  const close = () => {
    if (step.kind === "importing") return;
    freeImages();
    setStep({ kind: "pick" });
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const runImport = async () => {
    if (step.kind !== "review") return;
    const { draft } = step;
    let content = draft.content;
    let coverIndex: number | null = null;
    if (opts.cover) {
      const m = /!\[[^\]]*\]\(\/__doc-image\/(\d+)\)\n*/.exec(content);
      if (m) {
        coverIndex = Number(m[1]);
        content = content.replace(m[0], "").trim(); // the cover shows above the article, so not twice
      }
    }
    const used = new Set([...content.matchAll(IMG_LINK)].map((m) => Number(m[1])));
    if (coverIndex !== null) used.add(coverIndex);

    const uploaded = new Map<number, string>();
    let done = 0;
    let failed = 0;
    setStep({ kind: "importing", done, total: used.size });
    for (const i of used) {
      const img = draft.images[i];
      if (img) {
        const fd = new FormData();
        fd.set("file", new File([img.blob], `doc-image-${i}.${img.blob.type.split("/")[1] ?? "png"}`, { type: img.blob.type }));
        const res = await uploadImage(fd);
        if (res.ok) uploaded.set(i, res.data.url);
        else failed++;
      }
      setStep({ kind: "importing", done: ++done, total: used.size });
    }
    content = content
      .replace(/!\[([^\]]*)\]\(\/__doc-image\/(\d+)\)\n*/g, (m, alt: string, i: string) =>
        uploaded.has(Number(i)) ? m.replace(`${DOC_IMAGE}${i}`, uploaded.get(Number(i))!) : "",
      )
      .trim();

    onImport({
      content,
      mode: opts.mode,
      title: opts.title ? draft.title : undefined,
      excerpt: opts.excerpt ? draft.excerpt : undefined,
      coverImage: coverIndex !== null ? uploaded.get(coverIndex) : undefined,
    });
    freeImages();
    setStep({ kind: "pick" });
    onClose();
    if (failed) setTimeout(() => window.alert(`${failed} picture(s) couldn't be uploaded and were left out.`), 50);
  };

  const pick = (files: FileList | null | undefined) => {
    const f = files?.[0];
    if (f) void read(f);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-ink/50 p-3 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="doc-import-title"
            className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_120px_-30px_rgba(11,11,15,0.6)]"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <div className="h-1.5 bg-brand bg-[length:200%_200%] animate-gradient" />
            <header className="flex items-start gap-4 px-6 pb-2 pt-6 sm:px-8">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-ink ring-1 ring-line">
                <FileText className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="doc-import-title" className="font-display text-2xl leading-tight sm:text-3xl">
                  Import from Word
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Headings, tables, lists, bold text, links and pictures come across exactly as they are in your document.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={step.kind === "importing"}
                aria-label="Close"
                className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-ink hover:text-white disabled:opacity-30"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="px-6 pb-6 pt-4 sm:px-8 sm:pb-8">
              <AnimatePresence mode="wait">
                {step.kind === "pick" && (
                  <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <input
                      ref={inputRef}
                      type="file"
                      hidden
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => {
                        pick(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDrag(true);
                      }}
                      onDragLeave={() => setDrag(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDrag(false);
                        pick(e.dataTransfer.files);
                      }}
                      className={cn(
                        "group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-all duration-300",
                        drag ? "scale-[1.01] border-amber bg-brand-soft" : "border-line bg-cream/60 hover:border-ink/30 hover:bg-cream",
                      )}
                    >
                      <motion.span
                        className="relative grid size-20 place-items-center rounded-3xl bg-white shadow-[0_18px_40px_-18px_rgba(255,122,0,0.55)] ring-1 ring-line"
                        animate={{ y: drag ? -6 : [0, -5, 0] }}
                        transition={drag ? { duration: 0.2 } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <UploadCloud className="size-9 text-ink" />
                        <span className="absolute -right-2 -top-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
                          DOCX
                        </span>
                      </motion.span>
                      <span className="mt-6 font-display text-xl sm:text-2xl">{drag ? "Drop it here" : "Drop your Word document here"}</span>
                      <span className="mt-1.5 text-sm text-ink-soft">
                        or <span className="font-semibold text-ink underline decoration-amber decoration-2 underline-offset-4">choose a file</span>
                      </span>
                      <span className="mt-5 text-xs text-mute">Word .docx up to 40 MB · Google Docs: File → Download → Microsoft Word</span>
                    </button>
                    {error && (
                      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-[#fdf1f0] px-4 py-3 text-sm text-[#b42318]">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
                      </p>
                    )}
                    <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
                      {[
                        { icon: Heading, t: "Headings", d: "Heading 1, 2, 3… become the post's sections" },
                        { icon: Table, t: "Tables", d: "Rows and columns, ready for phones too" },
                        { icon: ImageIcon, t: "Pictures", d: "Uploaded to your media library" },
                      ].map(({ icon: Icon, t, d }) => (
                        <li key={t} className="rounded-2xl border border-line p-4">
                          <Icon className="size-4 text-sun" />
                          <p className="mt-2 font-semibold">{t}</p>
                          <p className="mt-0.5 text-xs text-ink-soft">{d}</p>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {step.kind === "reading" && (
                  <motion.div key="reading" className="py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <span className="relative mx-auto grid size-20 place-items-center">
                      <span className="absolute inset-0 animate-spin rounded-full bg-brand [mask:radial-gradient(farthest-side,transparent_calc(100%-4px),#000_0)]" />
                      <FileText className="size-8" />
                    </span>
                    <p className="mt-6 font-display text-xl">Reading your document…</p>
                    <p className="mt-1 truncate text-sm text-mute">{step.name}</p>
                  </motion.div>
                )}

                {step.kind === "review" && (
                  <motion.div key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Review step={step} opts={opts} setOpts={setOpts} has={has} />
                    <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                      <Button variant="ghost" onClick={() => setStep({ kind: "pick" })}>
                        Choose another file
                      </Button>
                      <Button variant="brand" onClick={runImport}>
                        <Check className="size-4" /> Import into the post
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step.kind === "importing" && (
                  <motion.div key="importing" className="py-14 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Loader2 className="mx-auto size-8 animate-spin" />
                    <p className="mt-5 font-display text-xl">
                      {step.total ? `Uploading pictures ${step.done} of ${step.total}…` : "Building your post…"}
                    </p>
                    <div className="mx-auto mt-5 h-2 max-w-sm overflow-hidden rounded-full bg-cream">
                      <motion.div
                        className="h-full rounded-full bg-brand"
                        animate={{ width: `${step.total ? (step.done / step.total) * 100 : 100}%` }}
                        transition={{ ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Review({
  step,
  opts,
  setOpts,
  has,
}: {
  step: { name: string; draft: DocDraft };
  opts: { mode: "replace" | "append"; title: boolean; excerpt: boolean; cover: boolean };
  setOpts: React.Dispatch<React.SetStateAction<{ mode: "replace" | "append"; title: boolean; excerpt: boolean; cover: boolean }>>;
  has: { content: boolean };
}) {
  const { draft } = step;
  const s = draft.stats;
  const chips = [
    { icon: Heading, n: s.headings, label: "heading" },
    { icon: Table, n: s.tables, label: "table" },
    { icon: List, n: s.lists, label: "list" },
    { icon: ImageIcon, n: s.images, label: "picture" },
    { icon: Type, n: s.words, label: "word" },
  ];
  const preview = (src: string) => {
    const i = src.startsWith(DOC_IMAGE) ? Number(src.slice(DOC_IMAGE.length)) : -1;
    return i >= 0 ? (draft.images[i]?.url ?? "") : src;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-mute">
          <Check className="size-3.5 text-emerald-600" /> {step.name}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map(({ icon: Icon, n, label }) => (
            <span key={label} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs", n ? "border-line bg-cream" : "border-dashed border-line text-mute")}>
              <Icon className="size-3.5" />
              <b className="font-semibold">{n.toLocaleString()}</b> {label}
              {n === 1 ? "" : "s"}
            </span>
          ))}
        </div>
        {s.skipped > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-2xl bg-[#fff8eb] px-3 py-2 text-xs text-[#8a5a00]">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            {s.skipped} drawing{s.skipped > 1 ? "s" : ""} (Word shapes or charts) can&apos;t be shown on a web page and will be left out. Save them as pictures to include them.
          </p>
        )}
        <div className="relative mt-4 max-h-[46vh] overflow-y-auto rounded-3xl border border-line bg-cream/40 p-5">
          {opts.title && <p className="mb-4 font-display text-3xl leading-tight">{draft.title}</p>}
          {draft.content ? (
            <Markdown className="compact" resolveImage={preview}>
              {draft.content}
            </Markdown>
          ) : (
            <p className="text-sm text-mute">This document has no text to import.</p>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">Fill in</p>
        <Toggle on={opts.title} set={(v) => setOpts((o) => ({ ...o, title: v }))} label="Post title">
          <span className="line-clamp-2">“{draft.title}”</span>
        </Toggle>
        {draft.excerpt && (
          <Toggle on={opts.excerpt} set={(v) => setOpts((o) => ({ ...o, excerpt: v }))} label="Excerpt">
            <span className="line-clamp-2">From the first paragraph</span>
          </Toggle>
        )}
        {s.images > 0 && (
          <Toggle on={opts.cover} set={(v) => setOpts((o) => ({ ...o, cover: v }))} label="Cover image">
            The first picture
          </Toggle>
        )}
        {has.content && (
          <div className="rounded-2xl border border-line p-1">
            {(
              [
                ["append", "Add below what's written"],
                ["replace", "Replace what's written"],
              ] as const
            ).map(([m, t]) => (
              <button
                key={m}
                type="button"
                onClick={() => setOpts((o) => ({ ...o, mode: m }))}
                className={cn("block w-full rounded-xl px-3 py-2 text-left text-xs transition", opts.mode === m ? "bg-ink text-white" : "hover:bg-cream")}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({ on, set, label, children }: { on: boolean; set: (v: boolean) => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => set(!on)}
      className={cn("flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition", on ? "border-ink bg-white shadow-sm" : "border-line bg-cream/50 opacity-70 hover:opacity-100")}
    >
      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition", on ? "border-ink bg-ink text-white" : "border-line bg-white")}>
        {on && <Check className="size-3.5" />}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="block text-xs text-ink-soft">{children}</span>
      </span>
    </button>
  );
}
