"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
        } catch {}
        setCopied(true);
        toast.success(`Code ${code} copied`);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="group inline-flex items-center gap-3 rounded-full border-2 border-dashed border-ink/30 bg-white px-5 py-3 font-mono text-lg font-semibold tracking-widest transition hover:border-ink hover:bg-ink hover:text-white"
    >
      {code}
      {copied ? <Check className="size-4" /> : <Copy className="size-4 transition group-hover:rotate-12" />}
    </button>
  );
}
