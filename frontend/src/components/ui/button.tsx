import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "brand" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "sheen group/btn inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-all duration-500 ease-[var(--ease-luxe)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber/30";

const variants: Record<Variant, string> = {
  // Ink pill that blooms into the logo gradient on hover
  primary:
    "relative bg-ink text-white shadow-[0_8px_24px_-10px_rgba(11,11,15,0.6)] before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-brand before:opacity-0 before:transition-opacity before:duration-500 hover:text-ink hover:before:opacity-100 hover:shadow-[0_14px_34px_-12px_rgba(255,122,0,0.55)] z-0",
  brand:
    "bg-brand bg-[length:200%_200%] text-ink animate-gradient shadow-[0_10px_30px_-12px_rgba(255,122,0,0.55)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgba(25,211,243,0.6)]",
  outline:
    "border border-ink/15 bg-white/70 text-ink backdrop-blur hover:border-ink hover:bg-ink hover:text-white",
  ghost: "text-ink hover:bg-ink/5",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-[0.95rem]",
};

type Common = { variant?: Variant; size?: Size };

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & Common) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & Common) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
