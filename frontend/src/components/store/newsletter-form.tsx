"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { subscribe } from "@/app/actions/store";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      className="group flex max-w-sm items-center rounded-full border border-white/15 bg-white/5 p-1.5 transition focus-within:border-amber"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await subscribe(email);
          if (res.ok) {
            setDone(true);
            setEmail("");
            toast.success("You're on the list ✨");
          } else toast.error(res.error);
        });
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/40"
      />
      <button
        disabled={pending}
        aria-label="Subscribe"
        className="grid size-10 place-items-center rounded-full bg-brand text-ink transition-transform duration-300 hover:scale-110 hover:rotate-[-8deg]"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : done ? (
          <Check className="size-4" />
        ) : (
          <ArrowRight className="size-4" />
        )}
      </button>
    </form>
  );
}
