/**
 * Word (.docx) → blog post Markdown, in the browser.
 *
 * mammoth reads the document into simple HTML (headings, paragraphs, lists, tables, bold/italic, links,
 * pictures); this file turns that HTML into the Markdown the blog editor uses. Pictures are kept as
 * local blobs with placeholder links (/__doc-image/N) until the admin confirms the import, so nothing is
 * uploaded for an import that is cancelled.
 */

export const DOC_IMAGE = "/__doc-image/";
export const MAX_DOC_BYTES = 40 * 1024 * 1024;

export type DocImage = { blob: Blob; url: string }; // url: object URL for the preview
export type DocDraft = {
  title: string;
  excerpt: string;
  content: string;
  images: (DocImage | null)[]; // null = a picture the browser can't convert (e.g. EMF drawings)
  stats: { headings: number; tables: number; lists: number; images: number; skipped: number; words: number };
};

const UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024; // the upload limit is 5 MB
const MAX_SIDE = 2000;

const STYLE_MAP = [
  "p[style-name='Title'] => h1.doc-title:fresh",
  "p[style-name='Subtitle'] => p.doc-subtitle:fresh",
  "p[style-name='Quote'] => blockquote > p:fresh",
  "p[style-name='Intense Quote'] => blockquote > p:fresh",
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
];

export async function readDocx(file: File): Promise<DocDraft> {
  if (/\.doc$/i.test(file.name)) {
    throw new Error("This is an old .doc file. Open it in Word and use File → Save As → Word Document (.docx).");
  }
  if (!/\.docx$/i.test(file.name)) throw new Error("Choose a Word document (.docx).");
  if (file.size > MAX_DOC_BYTES) throw new Error("This document is over 40 MB. Make the pictures smaller and try again.");

  const { default: mammoth } = await import("mammoth");
  const raw: Blob[] = [];
  const result = await mammoth.convertToHtml(
    { arrayBuffer: await file.arrayBuffer() },
    {
      styleMap: STYLE_MAP,
      convertImage: mammoth.images.imgElement(async (img) => {
        raw.push(new Blob([await img.readAsArrayBuffer()], { type: img.contentType }));
        return { src: `${DOC_IMAGE}${raw.length - 1}` };
      }),
    },
  ).catch(() => {
    throw new Error("This file couldn't be read. Make sure it is a Word document that opens in Word.");
  });

  const images = await Promise.all(raw.map(prepareImage));
  const doc = new DOMParser().parseFromString(`<body>${result.value}</body>`, "text/html");
  const body = doc.body;
  mergeAdjacentMarks(body);

  // Title: Word's "Title" style, or a Heading 1 at the very top; otherwise the file name.
  let title = "";
  const first = firstBlock(body);
  const titleEl = body.querySelector("h1.doc-title") ?? (first?.tagName === "H1" ? first : null);
  if (titleEl) {
    title = clean(titleEl.textContent);
    titleEl.remove();
  }
  if (!title) title = file.name.replace(/\.docx$/i, "").replace(/[-_]+/g, " ").trim();

  // Excerpt: Word's "Subtitle" style, or the first real paragraph.
  const subtitle = body.querySelector("p.doc-subtitle");
  let excerpt = clean(subtitle?.textContent);
  subtitle?.remove();
  if (!excerpt) {
    const p = [...body.querySelectorAll(":scope > p")].find((x) => clean(x.textContent).length > 30);
    excerpt = shorten(clean(p?.textContent), 280);
  }

  // The post title is the page's only H1, so the document's headings start at H2 (keeping their order).
  const heads = [...body.querySelectorAll("h1,h2,h3,h4,h5,h6")];
  const top = Math.min(...heads.map((h) => Number(h.tagName[1])), 2);
  const level = (h: Element) => Math.min(6, Math.max(2, Number(h.tagName[1]) - top + 2));

  const md = blocks(body, level).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  const skipped = images.filter((x) => !x).length;
  // a picture that couldn't be converted is dropped from the text
  const content = md.replace(/!\[[^\]]*\]\(\/__doc-image\/(\d+)\)\n*/g, (m, i) => (images[Number(i)] ? m : ""));

  return {
    title,
    excerpt,
    content,
    images,
    stats: {
      headings: heads.length - (titleEl && heads.includes(titleEl) ? 1 : 0),
      // a 1x1 table is a boxed note, not a table
      tables: [...body.querySelectorAll("table")].filter((t) => t.querySelectorAll("td, th").length > 1).length,
      lists: body.querySelectorAll(":scope > ul, :scope > ol").length,
      images: images.length - skipped,
      skipped,
      words: clean(body.textContent).split(" ").filter(Boolean).length,
    },
  };
}

/** Pictures go up as JPG/PNG/WEBP/AVIF under 5 MB; anything else is redrawn as WEBP (or skipped if unreadable). */
async function prepareImage(blob: Blob): Promise<DocImage | null> {
  let out: Blob | null = blob;
  if (!UPLOAD_TYPES.has(blob.type) || blob.size > MAX_IMAGE_BYTES) {
    try {
      const bmp = await createImageBitmap(blob);
      const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      bmp.close();
      const encode = (q: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", q));
      out = await encode(0.85);
      if (out && out.size > MAX_IMAGE_BYTES) out = await encode(0.65);
      if (out && out.size > MAX_IMAGE_BYTES) out = null;
    } catch {
      out = null; // e.g. EMF/WMF drawings, which browsers can't open
    }
  }
  return out ? { blob: out, url: URL.createObjectURL(out) } : null;
}

/* ───────────── HTML → Markdown ───────────── */

const clean = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();
const shorten = (t: string, max: number) => {
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[,;:.\s]+$/, "")}…`;
};
const esc = (t: string) => t.replace(/([\\`*_[\]])/g, "\\$1");

function firstBlock(body: HTMLElement): Element | null {
  for (const el of body.children) if (clean(el.textContent) || el.querySelector("img")) return el;
  return null;
}

/** Word often splits one bold phrase into several runs: <strong>Sum</strong><strong> of beauty</strong>. */
function mergeAdjacentMarks(root: Element) {
  for (const el of [...root.querySelectorAll("strong, em, s, del, u")]) {
    let next = el.nextSibling;
    while (next && next.nodeType === Node.ELEMENT_NODE && (next as Element).tagName === el.tagName) {
      el.append(...next.childNodes);
      next.remove();
      next = el.nextSibling;
    }
  }
}

function mark(m: string, inner: string) {
  if (!inner.trim()) return inner;
  const lead = /^\s*/.exec(inner)![0];
  const trail = /\s*$/.exec(inner)![0];
  return `${lead}${m}${inner.trim()}${m}${trail}`;
}

function inline(node: Node, inCell = false): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = esc((node.textContent ?? "").replace(/\s+/g, " "));
    return inCell ? t.replace(/\|/g, "\\|") : t;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as Element;
  const kids = () => [...el.childNodes].map((c) => inline(c, inCell)).join("");
  switch (el.tagName) {
    case "STRONG":
    case "B":
      return mark("**", kids());
    case "EM":
    case "I":
      return mark("*", kids());
    case "S":
    case "DEL":
    case "STRIKE":
      return mark("~~", kids());
    case "BR":
      return inCell ? " " : "\\\n";
    case "IMG": {
      const src = el.getAttribute("src") ?? "";
      return src ? `![${esc(clean(el.getAttribute("alt"))).replace(/\n/g, " ")}](${src})` : "";
    }
    case "A": {
      const text = kids();
      const href = el.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || !clean(text)) return text; // bookmarks / footnote anchors
      return `[${text.trim()}](${href.replace(/ /g, "%20").replace(/\)/g, "%29")})`;
    }
    case "SUP":
      // footnote markers ("[1]") add noise to a web article
      return el.querySelector("a[href^='#']") ? "" : kids();
    default:
      return kids();
  }
}

const inlineOf = (el: Element, inCell = false) =>
  [...el.childNodes].map((c) => inline(c, inCell)).join("").replace(/[ \t]+/g, " ").trim();

function blocks(parent: Element, level: (h: Element) => number): string[] {
  const out: string[] = [];
  for (const node of parent.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = clean(node.textContent);
      if (t) out.push(esc(t));
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as Element;
    switch (el.tagName) {
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6": {
        const text = inlineOf(el).replace(/\\\n/g, " ");
        if (text) out.push(`${"#".repeat(level(el))} ${text}`);
        break;
      }
      case "P": {
        const text = inlineOf(el);
        if (text.replace(/\\\n/g, "").trim()) out.push(text);
        break;
      }
      case "UL":
      case "OL":
        out.push(list(el, 0));
        break;
      case "TABLE":
        out.push(table(el, level));
        break;
      case "BLOCKQUOTE":
        out.push(blocks(el, level).join("\n\n").split("\n").map((l) => (l ? `> ${l}` : ">")).join("\n"));
        break;
      case "PRE":
        out.push("```\n" + (el.textContent ?? "").replace(/\n$/, "") + "\n```");
        break;
      case "IMG":
        out.push(inline(el));
        break;
      default:
        out.push(...blocks(el, level));
    }
  }
  return out.filter((b) => b.trim());
}

function list(el: Element, indent: number): string {
  const lines: string[] = [];
  let n = Number(el.getAttribute("start")) || 1;
  for (const li of el.children) {
    if (li.tagName !== "LI") continue;
    const marker = el.tagName === "OL" ? `${n++}.` : "-";
    const text: string[] = [];
    const nested: string[] = [];
    for (const c of li.childNodes) {
      const tag = c.nodeType === Node.ELEMENT_NODE ? (c as Element).tagName : "";
      if (tag === "UL" || tag === "OL") nested.push(list(c as Element, indent + marker.length + 1));
      else text.push(inline(c));
    }
    lines.push(`${" ".repeat(indent)}${marker} ${text.join("").replace(/\\\n/g, " ").replace(/\s+/g, " ").trim()}`, ...nested);
  }
  return lines.join("\n");
}

function cellText(td: Element): string {
  const parts: string[] = [];
  for (const c of td.childNodes) {
    if (c.nodeType !== Node.ELEMENT_NODE) {
      parts.push(inline(c, true));
      continue;
    }
    const el = c as Element;
    if (el.tagName === "UL" || el.tagName === "OL") {
      parts.push([...el.querySelectorAll("li")].map((li) => `• ${inlineOf(li, true)}`).join(" "));
    } else if (el.tagName === "TABLE") {
      parts.push(clean(el.textContent).replace(/\|/g, "\\|"));
    } else {
      parts.push(inlineOf(el, true));
    }
  }
  return parts.filter((p) => p.trim()).join(" ").replace(/\s+/g, " ").trim();
}

function table(el: Element, level: (h: Element) => number): string {
  const rows = [...el.querySelectorAll(":scope > thead > tr, :scope > tbody > tr, :scope > tr, :scope > tfoot > tr")];
  // a 1×1 table is how Word users draw a box around text: keep it as a highlighted note instead
  const only = rows.length === 1 && rows[0].children.length === 1 ? rows[0].children[0] : null;
  if (only) {
    const inner = blocks(only, level).join("\n\n");
    return inner ? `> [!NOTE]\n${inner.split("\n").map((l) => (l ? `> ${l}` : ">")).join("\n")}` : "";
  }
  const grid = rows.map((tr) =>
    [...tr.children]
      .filter((c) => c.tagName === "TD" || c.tagName === "TH")
      .flatMap((td) => [cellText(td), ...Array(Math.max(0, (Number(td.getAttribute("colspan")) || 1) - 1)).fill("")]),
  );
  const cols = Math.max(0, ...grid.map((r) => r.length));
  if (!cols) return "";
  const line = (r: string[]) => `| ${[...r, ...Array(cols - r.length).fill("")].map((c) => c || " ").join(" | ")} |`;
  const [first, ...body] = grid;
  const head = first.map((c) => c.replace(/^\*\*(.+)\*\*$/, "$1")); // header cells are bold already
  return [line(head), line(Array(cols).fill("---")), ...body.map(line)].join("\n");
}
