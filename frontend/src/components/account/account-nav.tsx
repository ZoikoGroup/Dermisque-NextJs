"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, Shield, UserRound } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile & security", icon: UserRound },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
];

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-3xl bg-white p-2 lg:sticky lg:top-24 lg:flex-col">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/account" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors",
              active ? "text-white" : "hover:bg-cream",
            )}
          >
            {active && (
              <motion.span layoutId="acct-nav" className="absolute inset-0 rounded-2xl bg-ink" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
            )}
            <Icon className="relative size-4" />
            <span className="relative">{label}</span>
          </Link>
        );
      })}
      {isAdmin && (
        <Link href="/admin" className="flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm hover:bg-cream">
          <Shield className="size-4" /> Admin panel
        </Link>
      )}
      <form action={logout} className="shrink-0 lg:mt-2 lg:border-t lg:border-line lg:pt-2">
        <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-red-600 hover:bg-red-50">
          <LogOut className="size-4" /> Sign out
        </button>
      </form>
    </nav>
  );
}
