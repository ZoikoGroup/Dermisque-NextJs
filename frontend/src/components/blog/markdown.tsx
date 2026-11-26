import type { Element, ElementContent } from "hast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/* Extras on top of standard Markdown (all inserted by the blog editor's toolbar):
   - a YouTube link on its own line becomes an embedded video
   - [Shop now](/shop "button") renders as a button
   - "> [!TIP]" / [!NOTE] / [!WARNING] / [!IMPORTANT] at the start of a quote makes a coloured note box */

const YOUTUBE = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/;
const CALLOUT = /^\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*/i;
export const CALLOUT_TITLES: Record<string, string> = { note: "Note", tip: "Tip", warning: "Good to know", important: "Important" };

type MdNode = { type: string; value?: string; children?: MdNode[]; data?: { hProperties?: Record<string, unknown> } };

/** Turns "> [!TIP] text" quotes into callout boxes (class "callout callout-tip"). */
function remarkCallouts() {
  const walk = (node: MdNode) => {
    if (node.type === "blockquote") {
      const first = node.children?.[0];
      const text = first?.type === "paragraph" ? first.children?.[0] : undefined;
      const m = text?.type === "text" && text.value ? CALLOUT.exec(text.value) : null;
      if (m && text) {
        text.value = text.value!.slice(m[0].length);
        const kind = m[1].toLowerCase();
        node.data = { ...node.data, hProperties: { className: `callout callout-${kind}`, "data-title": CALLOUT_TITLES[kind] } };
      }
    }
    node.children?.forEach(walk);
  };
  return (tree: MdNode) => walk(tree);
}

/** The YouTube id when a paragraph is nothing but a bare YouTube link. */
function youtubeId(node: Element | undefined): string | null {
  const kids = (node?.children ?? []).filter((c: ElementContent) => !(c.type === "text" && !c.value.trim()));
  const a = kids.length === 1 && kids[0].type === "element" && kids[0].tagName === "a" ? kids[0] : null;
  const href = typeof a?.properties?.href === "string" ? a.properties.href : "";
  const label = a?.children.length === 1 && a.children[0].type === "text" ? a.children[0].value : "";
  if (!href || label !== href) return null; // only bare links, so "[watch this](youtube…)" stays a normal link
  return YOUTUBE.exec(href)?.[1] ?? null;
}

/**
 * Renders post Markdown with the brand article styles (.dq-article in globals.css).
 * Raw HTML is not rendered (react-markdown default), so content can't inject scripts.
 */
export function Markdown({
  children,
  className,
  resolveImage,
}: {
  children: string;
  className?: string;
  /** Maps an image link before display (the Word import previews pictures that aren't uploaded yet). */
  resolveImage?: (src: string) => string;
}) {
  return (
    <div className={cn("dq-article", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkCallouts]}
        components={{
          a: ({ href, title, children }) => {
            const external = href?.startsWith("http");
            const target = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
            if (title === "button") {
              return (
                <a href={href} className="dq-button" {...target}>
                  {children}
                </a>
              );
            }
            return (
              <a href={href} title={title} {...target}>
                {children}
              </a>
            );
          },
          p: ({ node, children }) => {
            const id = youtubeId(node);
            if (!id) return <p>{children}</p>;
            return (
              <div className="dq-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${id}`}
                  title="YouTube video"
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );
          },
          table: ({ children }) => (
            <div className="dq-table">
              <table>{children}</table>
            </div>
          ),
          img: ({ src, alt }) => {
            const url = typeof src === "string" ? src : "";
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={resolveImage ? resolveImage(url) : url} alt={alt ?? ""} loading="lazy" />;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
