"use client";

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
import { NavMenu, type MenuKey } from "@/components/store/nav-menus";
import { cn } from "@/lib/utils";

type SessionLite = { name: string; role: "USER" | "ADMIN" } | null;

const nav: { href: string; label: string; menu?: MenuKey; hot?: boolean }[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "All Products", menu: "products" },
  { href: "/shop", label: "Shop by Concern", menu: "concern" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/consultation", label: "Free Consultation", menu: "consult" },
  { href: "/contact", label: "Contact" },
];

export function Header({ session }: { session: SessionLite }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState<MenuKey | null>(null);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  // Close menus on navigation (reset state when the path changes, during render)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenu(null);
    setMobile(false);
    setSearch(false);
    setUserMenu(false);
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-all duration-500",
          scrolled
            ? "border-line/80 bg-white/85 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)] backdrop-blur-xl"
            : "border-line bg-white",
        )}
        onMouseLeave={() => setMenu(null)}
      >
        <div
          className={cn(
            "mx-auto w-full max-w-[112rem] px-4 sm:px-6 lg:px-10 2xl:px-[4.5rem] flex items-center justify-between gap-6 transition-all duration-500",
            scrolled ? "h-[4.25rem]" : "h-[5.25rem]",
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
            className={cn("transition-all duration-500", scrolled ? "w-36 sm:w-44" : "w-40 sm:w-48 xl:w-56")}
          />

          <nav className="hidden items-center gap-5 lg:flex xl:gap-9">
            {nav.map((item) => {
              const open = !!item.menu && menu === item.menu;
              const active = menu
                ? open
                : !item.menu || item.menu === "products"
                  ? item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
                  : false;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onMouseEnter={() => setMenu(item.menu ?? null)}
                  onFocus={() => item.menu && setMenu(item.menu)}
                  onClick={() => setMenu(null)}
                  aria-expanded={item.menu ? open : undefined}
                  aria-haspopup={item.menu ? "true" : undefined}
                  className={cn(
                    "group relative flex items-center gap-1 whitespace-nowrap py-2 text-[0.92rem] text-ink transition-colors hover:text-[#0f3d35] xl:text-[1.05rem]",
                    open && "text-[#0f3d35]",
                    item.hot && "font-semibold text-[#9b1c2c]",
                  )}
                >
                  {item.label}
                  {item.menu && (
                    <ChevronDown className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} />
                  )}
                  <span
                    className={cn(
                      "absolute -bottom-1.5 left-0 h-[3px] w-full origin-left rounded-full bg-[#b8955a] transition-transform duration-300",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 xl:gap-3">
            <IconBtn label="Search" onClick={() => setSearch(true)}>
              <Search className="size-[1.35rem]" strokeWidth={1.6} />
            </IconBtn>
            <WishlistIcon />
            <div className="relative hidden sm:block">
              <IconBtn
                label="Account"
                onClick={() => setUserMenu((v) => !v)}
                onBlur={() => setTimeout(() => setUserMenu(false), 150)}
              >
                <User className="size-[1.35rem]" strokeWidth={1.6} />
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

        {/* dropdown panels */}
        <AnimatePresence>
          {menu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="absolute inset-x-0 top-full hidden pt-3 lg:block"
            >
              <div className="mx-auto w-full max-w-[112rem] px-6 xl:px-16 2xl:px-24">
                <AnimatePresence mode="wait" initial={false}>
                  <NavMenu key={menu} menu={menu} onNavigate={() => setMenu(null)} />
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none fixed inset-0 z-30 hidden bg-[#0f3d35]/20 lg:block"
          />
        )}
      </AnimatePresence>

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
      <ShoppingBag className="size-[1.35rem]" strokeWidth={1.6} />
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
      <Heart className="size-[1.35rem]" strokeWidth={1.6} />
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
                .filter((n) => n.menu !== "concern")
                .map((n, i) => (
                  <motion.div
                    key={n.label}
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
