"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => window.location.href;

  const btn =
    "grid size-11 place-items-center rounded-full border border-line bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-white";

  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-xs uppercase tracking-[0.2em] text-mute">Share</span>
      <button
        className={btn}
        aria-label="Copy link"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url());
          } catch {}
          setCopied(true);
          toast.success("Link copied");
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      </button>
      <a
        className={btn}
        aria-label="Share on Facebook"
        target="_blank"
        rel="noopener noreferrer"
        href="#"
        onClick={(e) => {
          e.currentTarget.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`;
        }}
      >
        <span className="text-sm font-bold">f</span>
      </a>
      <a
        className={btn}
        aria-label="Share on X"
        target="_blank"
        rel="noopener noreferrer"
        href="#"
        onClick={(e) => {
          e.currentTarget.href = `https://x.com/intent/post?url=${encodeURIComponent(url())}&text=${encodeURIComponent(title)}`;
        }}
      >
        <span className="text-sm font-bold">𝕏</span>
      </a>
      <button
        className={`${btn} sm:hidden`}
        aria-label="Share"
        onClick={() => navigator.share?.({ title, url: url() }).catch(() => {})}
      >
        <Share2 className="size-4" />
      </button>
    </div>
  );
}
