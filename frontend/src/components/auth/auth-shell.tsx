"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/login", label: "Login", match: ["/login"] },
  { href: "/register", label: "Register", match: ["/register"] },
  { href: "/forgot-password", label: "Reset Password", match: ["/forgot-password", "/reset-password"] },
];

export function AuthTabs() {
  const pathname = usePathname();
  const next = useSearchParams().get("next");
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <>
      <nav className="mt-6 sm:mt-[2vh] grid grid-cols-3 gap-1.5 border-b border-[#e3d7c3]">
        {TABS.map((t) => {
          const active = t.match.includes(pathname);
          return (
            <Link
              key={t.href}
              href={t.href === "/forgot-password" ? t.href : t.href + q}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative rounded-t-2xl border border-b-0 whitespace-nowrap px-1 py-3 sm:py-[1.2vh] text-center text-[0.82rem] font-medium transition-colors sm:text-lg",
                active ? "border-transparent text-white" : "border-[#e8dcc8] bg-[#f6efe3] text-ink hover:bg-white",
              )}
            >
              {active && (
                <motion.span
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-t-2xl bg-[#0f3d35] shadow-[inset_0_-4px_0_#c9a45c]"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </Link>
          );
        })}
      </nav>
      <p className="mt-3 text-center text-sm text-ink-soft [@media(max-height:700px)_and_(max-width:1279px)]:hidden">
        Switch to{" "}
        <Link href={`/register${q}`} className="font-semibold text-[#0f3d35] hover:underline">
          Register
        </Link>{" "}
        to create an account, or{" "}
        <Link href="/forgot-password" className="font-semibold text-[#0f3d35] hover:underline">
          Reset Password
        </Link>{" "}
        to regain access.
      </p>
    </>
  );
}

/** The site is English-only today; the pill shows the current language. */
export function LanguagePill() {
  return (
    <label className="relative inline-flex items-center rounded-full border border-[#e3d7c3] bg-white/70 py-2 pl-3 pr-2 text-sm sm:pl-4 sm:text-base">
      <Globe className="pointer-events-none size-5 text-[#0f3d35]" strokeWidth={1.6} />
      <span className="sr-only">Language</span>
      <select
        defaultValue="en-US"
        className="cursor-pointer appearance-none bg-transparent pl-2.5 pr-7 outline-none sm:pl-3"
      >
        <option value="en-US">English (US)</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4" />
    </label>
  );
}
