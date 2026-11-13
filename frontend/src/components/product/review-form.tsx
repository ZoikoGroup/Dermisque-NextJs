"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { addReview } from "@/app/actions/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReviewForm({ slug, signedIn }: { slug: string; signedIn: boolean }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  if (!signedIn) {
    return (
      <div className="rounded-3xl border border-dashed border-line p-6 text-center">
        <p className="text-ink-soft">Share your experience with this serum.</p>
        <Link
          href={`/login?next=/product/${slug}`}
          className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
        >
          Sign in to write a review
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-3xl bg-white p-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await addReview(slug, { rating, title, body });
          if (res.ok) {
            toast.success("Thank you for your review!");
            setTitle("");
            setBody("");
          } else toast.error(res.error);
        });
      }}
    >
      <p className="font-display text-xl">Write a review</p>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            type="button"
            key={i}
            onMouseEnter={() => setHover(i)}
            onClick={() => setRating(i)}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            className="transition-transform hover:scale-125"
          >
            <Star className={cn("size-7", i <= (hover || rating) ? "fill-amber text-amber" : "text-line")} />
          </button>
        ))}
      </div>
      <input className="input" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        className="input min-h-28"
        placeholder="What did you like? How did your skin feel?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        minLength={10}
      />
      <Button disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />} Submit review
      </Button>
    </form>
  );
}
