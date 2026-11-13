"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[70vh] place-items-center px-6 text-center">
      <div>
        <p className="font-display text-5xl">Something went wrong</p>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">
          {error.message.includes("unavailable")
            ? error.message
            : "We couldn't load this page. Please try again."}
        </p>
        <Button className="mt-8" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
