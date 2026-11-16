import Image from "next/image";
import { BF_IMG } from "@/lib/black-friday";
import { cn } from "@/lib/utils";

/** Rotating "BLACK FRIDAY OFFER" roundel with the headline saving in the middle. */
export function Seal({ pct, className, label = "Save" }: { pct: number; className?: string; label?: string }) {
  return (
    <div
      className={cn(
        "relative grid aspect-square place-items-center rounded-full bg-[#1d1b3b] text-[#f4b740] shadow-[0_18px_40px_-12px_rgba(29,27,59,0.65)] ring-4 ring-[#1d1b3b]/10",
        className,
      )}
      role="img"
      aria-label={`Black Friday offer: ${label} ${pct}%`}
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full animate-spin-slow" aria-hidden>
        <defs>
          <path id="bf-seal-ring" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1" />
        <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1" />
        <text fill="currentColor" fontSize="15" fontWeight="700" letterSpacing="2">
          <textPath href="#bf-seal-ring" textLength="480">
            BLACK FRIDAY OFFER • BLACK FRIDAY OFFER •
          </textPath>
        </text>
      </svg>
      <div className="relative text-center font-sans leading-none">
        <div className="text-[0.95em] font-extrabold tracking-wide">{label.toUpperCase()}</div>
        <div className="mt-[0.1em] text-[1.35em] font-extrabold">{pct}%</div>
      </div>
    </div>
  );
}

/** The two copper bookmark ribbons from the campaign artwork. */
export function Ribbons({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none flex items-start gap-3", className)} aria-hidden>
      <Image src={`${BF_IMG}/ribbon-short.png`} alt="" width={51} height={125} className="h-auto w-[38%] origin-top animate-[bf-sway_5s_ease-in-out_infinite]" />
      <Image src={`${BF_IMG}/ribbon-long.png`} alt="" width={51} height={183} className="h-auto w-[38%] origin-top animate-[bf-sway_6s_ease-in-out_infinite_0.6s]" />
    </div>
  );
}

export function Pill({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "amber" }) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em]",
        tone === "ink" ? "bg-ink text-white" : "bg-[#ffc56b] text-[#4a1606]",
      )}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#b8862f]", className)}>
      {children}
    </p>
  );
}
