import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  light = false,
  href = "/",
}: {
  className?: string;
  light?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} aria-label="Dermisque home" className={cn("inline-block", className)}>
      <Image
        src={light ? "/logo-light.png" : "/logo.png"}
        alt="Dermisque — Sum of Beauty"
        width={1128}
        height={236}
        preload
        className="h-auto w-full"
      />
    </Link>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i <= Math.round(value) ? "fill-amber text-amber" : "fill-line text-line"}
        />
      ))}
    </span>
  );
}

const statusTone: Record<string, string> = {
  PENDING: "bg-amber/15 text-[#a15c00]",
  PROCESSING: "bg-aqua/15 text-teal",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  PAID: "bg-emerald-100 text-emerald-700",
  UNPAID: "bg-amber/15 text-[#a15c00]",
  REFUNDED: "bg-zinc-100 text-zinc-600",
  NEW: "bg-aqua/15 text-teal",
  READ: "bg-zinc-100 text-zinc-600",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  ADMIN: "bg-ink text-white",
  USER: "bg-zinc-100 text-zinc-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide",
        statusTone[status] ?? "bg-zinc-100 text-zinc-600",
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  center = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-ink-soft">{sub}</p>}
    </div>
  );
}
