"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  Newspaper,
  Package,
  Send,
  ShoppingCart,
  Star,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/messages", label: "Messages", icon: MessageSquareText },
  { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
  { href: "/admin/emails", label: "Emails", icon: Send },
];

export function AdminShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = nav.find((n) => (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)));

  const Sidebar = (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="flex items-center gap-3 px-6 py-6">
        <Image src="/sigma.png" alt="" width={34} height={34} />
        <div>
          <p className="font-display text-lg tracking-[0.2em]">DERMISQUE</p>
          <p className="text-[0.65rem] uppercase tracking-[0.25em] text-white/40">Admin</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = current?.href === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors",
                active ? "text-ink" : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              {active && (
                <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-xl bg-brand" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
              )}
              <Icon className="relative size-4 transition-transform group-hover:scale-110" />
              <span className="relative font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white">
          <ExternalLink className="size-4" /> View store
        </Link>
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <LogOut className="size-4" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh bg-[#f6f4f0] lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-svh lg:block">{Sidebar}</aside>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-64"
              onClick={(e) => e.stopPropagation()}
            >
              {Sidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-line bg-[#f6f4f0]/85 px-4 py-4 backdrop-blur-xl sm:px-8">
          <button className="rounded-lg p-1.5 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <h1 className="font-display text-2xl">{current?.label ?? "Admin"}</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-soft sm:block">{name}</span>
            <span className="grid size-9 place-items-center rounded-full bg-brand text-sm font-semibold">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-4 sm:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
