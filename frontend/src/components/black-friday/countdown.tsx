"use client";

import { useNow } from "@/hooks/use-now";
import { campaignStatus } from "@/lib/black-friday";
import { cn } from "@/lib/utils";

const UNITS = [
  { label: "Days", ms: 86_400_000 },
  { label: "Hours", ms: 3_600_000 },
  { label: "Minutes", ms: 60_000 },
  { label: "Seconds", ms: 1000 },
] as const;

/** Splits the time until the next campaign milestone (start, or end once live) into d/h/m/s. */
export function useCountdown(startsAt: string, endsAt: string) {
  const now = useNow();
  if (now === null) return { status: null, parts: null };
  const status = campaignStatus({ startsAt, endsAt }, now);
  const target = Date.parse(status === "upcoming" ? startsAt : endsAt);
  const left = Math.max(0, target - now);
  const parts = UNITS.map((u, i) => {
    const above = i === 0 ? Infinity : UNITS[i - 1].ms;
    return { label: u.label, value: Math.floor((left % above) / u.ms) };
  });
  return { status, parts };
}

export function CountdownBoxes({
  startsAt,
  endsAt,
  variant = "dark",
  className,
}: {
  startsAt: string;
  endsAt: string;
  variant?: "dark" | "light";
  className?: string;
}) {
  const { parts } = useCountdown(startsAt, endsAt);
  return (
    <div className={cn("grid grid-cols-4 gap-2 sm:gap-3", className)} role="timer" aria-live="off">
      {(parts ?? UNITS.map((u) => ({ label: u.label, value: null as number | null }))).map((p) => (
        <div
          key={p.label}
          className={cn(
            "flex flex-col items-center justify-center rounded-md border text-center",
            variant === "dark" ? "border-white/15 bg-white/[0.03] px-2 py-4 sm:px-6 sm:py-5" : "border-ink/10 bg-white px-1 py-2.5",
          )}
        >
          <span
            className={cn(
              "font-display tabular-nums leading-none",
              variant === "dark" ? "text-3xl text-[#f4a51c] sm:text-5xl" : "text-2xl text-ink",
            )}
          >
            {p.value === null ? "--" : String(p.value).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "mt-2 text-[0.58rem] font-semibold uppercase tracking-[0.2em]",
              variant === "dark" ? "text-white/60" : "text-mute",
            )}
          >
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}
