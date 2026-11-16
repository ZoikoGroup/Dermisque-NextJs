"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/misc";
import { useCart, cartCount } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useMounted } from "@/hooks/use-mounted";
import { logout } from "@/app/actions/auth";
import { concerns } from "@/lib/site";
import { cn } from "@/lib/utils";

type SessionLite = { name: string; role: "USER" | "ADMIN" } | null;

const nav: { href: string; label: string; mega?: boolean; hot?: boolean }[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "All Products" },
  { href: "/black-friday", label: "Black Friday", hot: true },
  { href: "#concern", label: "Shop by Concern", mega: true },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/consultation", label: "Free Consultation" },
  { href: "/contact", label: "Contact" },
];

export function Header({ session }: { session: SessionLite }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation (reset state when the path changes, during render)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMega(false);
    setMobile(false);
    setSearch(false);
    setUserMenu(false);
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-500",
          scrolled
            ? "border-b border-line/80 bg-cream/80 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)] backdrop-blur-xl"
            : "bg-cream",
        )}
        onMouseLeave={() => setMega(false)}
      >
        <div
          className={cn(
            "container-luxe flex items-center justify-between gap-6 transition-all duration-500",
            scrolled ? "h-16" : "h-20",
          )}
        >
          <button
            className="-ml-2 rounded-full p-2 lg:hidden"
            onClick={() => setMobile(true)}
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </button>

          <Logo
            className={cn("transition-all duration-500", scrolled ? "w-36 sm:w-40" : "w-40 sm:w-48")}
          />

          <nav className="hidden items-center gap-7 lg:flex">
            {nav.map((item) =>
              item.mega ? (
                <button
                  key={item.label}
                  onMouseEnter={() => setMega(true)}
                  onClick={() => setMega((v) => !v)}
                  className="link-underline flex items-center gap-1 text-[0.82rem] font-medium tracking-wide"
                  data-active={mega}
                  aria-expanded={mega}
                >
                  {item.label}
                  <ChevronDown
                    className={cn("size-3.5 transition-transform duration-300", mega && "rotate-180")}
                  />
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setMega(false)}
                  className={cn(
                    "link-underline text-[0.82rem] font-medium tracking-wide",
                    item.hot && "relative flex items-center gap-1.5 font-semibold text-[#e11d2e]",
                  )}
                  data-active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
                >
                  {item.hot && (
                    <span className="relative flex size-1.5">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#e11d2e]/70" />
                      <span className="relative size-1.5 rounded-full bg-[#e11d2e]" />
                    </span>
                  )}
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <IconBtn label="Search" onClick={() => setSearch(true)}>
              <Search className="size-[1.15rem]" />
            </IconBtn>
            <WishlistIcon />
            <div className="relative hidden sm:block">
              <IconBtn
                label="Account"
                onClick={() => setUserMenu((v) => !v)}
                onBlur={() => setTimeout(() => setUserMenu(false), 150)}
              >
                <User className="size-[1.15rem]" />
              </IconBtn>
              <AnimatePresence>
                {userMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-2xl"
                  >
                    {session ? (
                      <>
                        <p className="px-3 pb-2 pt-1 text-xs text-mute">
                          Signed in as <span className="font-semibold text-ink">{session.name}</span>
                        </p>
                        {session.role === "ADMIN" && (
                          <MenuLink href="/admin" icon={LayoutDashboard}>
                            Admin panel
                          </MenuLink>
                        )}
                        <MenuLink href="/account" icon={User}>
                          My account
                        </MenuLink>
                        <MenuLink href="/account/orders" icon={Package}>
                          My orders
                        </MenuLink>
                        <form action={logout}>
                          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
                            <LogOut className="size-4" /> Sign out
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="grid gap-2 p-2">
                        <Link
                          href="/login"
                          className="rounded-full bg-ink py-2.5 text-center text-sm font-medium text-white transition hover:opacity-90"
                        >
                          Sign in
                        </Link>
                        <Link
                          href="/register"
                          className="rounded-full border border-line py-2.5 text-center text-sm font-medium transition hover:border-ink"
                        >
                          Create account
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <CartButton />
          </div>
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {mega && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-full hidden border-b border-line bg-white/95 backdrop-blur-xl lg:block"
            >
              <div className="container-luxe grid grid-cols-[1fr_320px] gap-10 py-10">
                <div>
                  <p className="eyebrow mb-5">Shop by concern</p>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-1">
                    {concerns.map((c, i) => (
                      <motion.div
                        key={c.slug}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Link
                          href={`/shop?concern=${c.slug}`}
                          className="group flex items-center justify-between rounded-xl px-3 py-3 font-display text-lg transition-colors hover:bg-cream"
                        >
                          {c.name}
                          <span className="translate-x-[-6px] text-brand opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                            →
                          </span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <Link
                  href="/shop"
                  className="group relative block aspect-[4/3] overflow-hidden rounded-3xl"
                >
                  <Image
                    src="/products/gold-serum.jpg"
                    alt="24 KT Gold Serum"
                    fill
                    sizes="320px"
                    className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-luxe)] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-xs uppercase tracking-[0.25em] opacity-80">New icon</p>
                    <p className="font-display text-xl">24 KT Gold Serum</p>
                  </div>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SearchOverlay open={search} onClose={() => setSearch(false)} />
      <MobileMenu open={mobile} onClose={() => setMobile(false)} session={session} />
    </>
  );
}

function IconBtn({
  label,
  children,
  ...props
}: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button
      aria-label={label}
      className="relative grid size-10 place-items-center rounded-full transition-all duration-300 hover:bg-ink hover:text-white"
      {...props}
    >
      {children}
    </button>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-cream"
    >
      <Icon className="size-4" /> {children}
    </Link>
  );
}

function CountBadge({ count, bump }: { count: number; bump?: number }) {
  if (!count) return null;
  return (
    <span
      key={bump}
      className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] animate-pop place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-ink"
    >
      {count}
    </span>
  );
}

function CartButton() {
  const mounted = useMounted();
  const items = useCart((s) => s.items);
  const bump = useCart((s) => s.bump);
  const setOpen = useCart((s) => s.setOpen);
  return (
    <IconBtn label="Open cart" onClick={() => setOpen(true)}>
      <ShoppingBag className="size-[1.15rem]" />
      {mounted && <CountBadge count={cartCount(items)} bump={bump} />}
    </IconBtn>
  );
}

function WishlistIcon() {
  const mounted = useMounted();
  const count = useWishlist((s) => s.items.length);
  return (
    <Link
      href="/wishlist"
      aria-label="Wishlist"
      className="relative hidden size-10 place-items-center rounded-full transition-all duration-300 hover:bg-ink hover:text-white sm:grid"
    >
      <Heart className="size-[1.15rem]" />
      {mounted && <CountBadge count={count} />}
    </Link>
  );
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) setTimeout(() => ref.current?.focus(), 200);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-cream"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              className="container-luxe flex items-center gap-4 py-8"
              onSubmit={(e) => {
                e.preventDefault();
                const q = ref.current?.value.trim();
                router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
                onClose();
              }}
            >
              <Search className="size-6 text-mute" />
              <input
                ref={ref}
                placeholder="Search serums, ingredients, concerns…"
                className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-mute/60 sm:text-4xl"
              />
              <button type="button" onClick={onClose} aria-label="Close search" className="rounded-full p-2 hover:bg-ink/5">
                <X className="size-6" />
              </button>
            </form>
            <div className="container-luxe flex flex-wrap gap-2 pb-8">
              {["Vitamin C", "Niacinamide", "Retinol", "Hyaluronic", "Gold"].map((t) => (
                <Link
                  key={t}
                  href={`/shop?q=${encodeURIComponent(t)}`}
                  onClick={onClose}
                  className="rounded-full border border-line bg-white px-4 py-1.5 text-sm transition hover:border-ink hover:bg-ink hover:text-white"
                >
                  {t}
                </Link>
              ))}
            </div>
            <div className="h-1 bg-brand" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MobileMenu({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: SessionLite;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-cream"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line p-5">
              <Logo className="w-36" />
              <button onClick={onClose} aria-label="Close menu" className="rounded-full p-2 hover:bg-ink/5">
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col p-5">
              {nav
                .filter((n) => !n.mega)
                .map((n, i) => (
                  <motion.div
                    key={n.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <Link href={n.href} className="block border-b border-line/70 py-4 font-display text-2xl">
                      {n.label}
                    </Link>
                  </motion.div>
                ))}
              <p className="eyebrow mb-3 mt-8">Shop by concern</p>
              <div className="flex flex-wrap gap-2">
                {concerns.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/shop?concern=${c.slug}`}
                    className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="mt-auto grid gap-2 border-t border-line p-5">
              {session ? (
                <>
                  <Link href="/account" className="rounded-full bg-ink py-3 text-center text-sm font-medium text-white">
                    My account
                  </Link>
                  {session.role === "ADMIN" && (
                    <Link href="/admin" className="rounded-full border border-line py-3 text-center text-sm font-medium">
                      Admin panel
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href="/login" className="rounded-full bg-ink py-3 text-center text-sm font-medium text-white">
                    Sign in
                  </Link>
                  <Link href="/register" className="rounded-full border border-line py-3 text-center text-sm font-medium">
                    Create account
                  </Link>
                </>
              )}
              <Link href="/wishlist" className="py-2 text-center text-sm text-ink-soft">
                Wishlist
              </Link>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
