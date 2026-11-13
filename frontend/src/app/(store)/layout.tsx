import { cookies } from "next/headers";
import { Announcement } from "@/components/store/announcement";
import { CartDrawer } from "@/components/store/cart-drawer";
import { CartSync } from "@/components/store/cart-sync";
import { ChatWidget } from "@/components/store/chat-widget";
import { CurrencyProvider } from "@/components/store/currency-provider";
import { CurrencySwitcher } from "@/components/store/currency-switcher";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { getSession } from "@/lib/auth";
import { CURRENCY_COOKIE, DEFAULT_RATES, isCurrency, type Rates } from "@/lib/currency";

async function getRates(): Promise<Rates> {
  try {
    const res = await fetch(`${process.env.API_URL}/api/currencies`, { next: { revalidate: 3600 } });
    return res.ok ? { ...DEFAULT_RATES, ...(await res.json()) } : DEFAULT_RATES;
  } catch {
    return DEFAULT_RATES;
  }
}

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [session, jar, rates] = await Promise.all([getSession(), cookies(), getRates()]);
  const saved = jar.get(CURRENCY_COOKIE)?.value;
  return (
    <CurrencyProvider initial={isCurrency(saved) ? saved : "USD"} rates={rates}>
      <Announcement />
      <Header session={session ? { name: session.name, role: session.role } : null} />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      {session && <CartSync />}
      <CurrencySwitcher />
      <ChatWidget />
    </CurrencyProvider>
  );
}
