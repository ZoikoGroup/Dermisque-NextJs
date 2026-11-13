import Image from "@/components/ui/product-image";
import Link from "next/link";
import { AlertTriangle, ArrowRight, DollarSign, MessageSquareText, Package, ShoppingCart, Users } from "lucide-react";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { StatusBadge } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { ORDER_STATUSES } from "@/lib/site";
import type { Stats } from "@/lib/types";
import { cn, formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const ranges = [7, 30, 90];

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const days = ranges.includes(Number(sp.days)) ? Number(sp.days) : 30;
  const s = await api<Stats>("/api/admin/stats", { query: { days } });
  const rangeRevenue = s.revenueByDay.reduce((n, d) => n + d.revenue, 0);
  const rangeOrders = s.revenueByDay.reduce((n, d) => n + d.orders, 0);
  const totalStatus = Object.values(s.statusBreakdown).reduce((a, b) => a + (b ?? 0), 0) || 1;

  const kpis = [
    { label: "Total revenue", value: formatPrice(s.revenue), icon: DollarSign, href: "/admin/orders" },
    { label: "Orders", value: s.orders.toLocaleString(), icon: ShoppingCart, href: "/admin/orders" },
    { label: "Avg. order value", value: formatPrice(s.avgOrderValue), icon: Package, href: "/admin/orders" },
    { label: "Customers", value: s.customers.toLocaleString(), icon: Users, href: "/admin/customers" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="ring-brand group rounded-3xl bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-soft">{label}</p>
              <span className="grid size-10 place-items-center rounded-2xl bg-cream transition-all duration-500 group-hover:rotate-12 group-hover:bg-brand">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-4 font-display text-3xl">{value}</p>
          </Link>
        ))}
      </div>

      {(s.pendingOrders > 0 || s.newMessages > 0) && (
        <div className="flex flex-wrap gap-3">
          {s.pendingOrders > 0 && (
            <Link href="/admin/orders?status=PENDING" className="flex items-center gap-2 rounded-full bg-amber/15 px-4 py-2 text-sm text-[#7a4a00] transition hover:bg-amber/25">
              <ShoppingCart className="size-4" /> {s.pendingOrders} orders awaiting fulfilment <ArrowRight className="size-3.5" />
            </Link>
          )}
          {s.newMessages > 0 && (
            <Link href="/admin/messages" className="flex items-center gap-2 rounded-full bg-aqua/15 px-4 py-2 text-sm text-teal transition hover:bg-aqua/25">
              <MessageSquareText className="size-4" /> {s.newMessages} new messages <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-3xl bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl">Revenue</h2>
              <p className="mt-1 text-sm text-mute">
                {formatPrice(rangeRevenue)} from {rangeOrders} orders · last {days} days (excl. cancelled)
              </p>
            </div>
            <div className="flex rounded-full border border-line p-1 text-xs">
              {ranges.map((r) => (
                <Link
                  key={r}
                  href={`/admin?days=${r}`}
                  scroll={false}
                  className={cn("rounded-full px-3 py-1.5 transition", r === days ? "bg-ink text-white" : "hover:bg-cream")}
                >
                  {r}d
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <RevenueChart data={s.revenueByDay} />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6">
          <h2 className="font-display text-xl">Orders by status</h2>
          <ul className="mt-6 space-y-4">
            {ORDER_STATUSES.map((st) => {
              const n = s.statusBreakdown[st] ?? 0;
              return (
                <li key={st}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <StatusBadge status={st} />
                    <span className="font-medium tabular-nums">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-cream">
                    <div className="h-full rounded-full bg-ink/80" style={{ width: `${(n / totalStatus) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-3xl bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm hover:underline">View all</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-mute">
                <tr>
                  <th className="py-2 font-medium">Order</th>
                  <th className="py-2 font-medium">Customer</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {s.recentOrders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-cream">
                    <td className="py-3">
                      <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono font-medium hover:underline">{o.orderNumber}</Link>
                      <p className="text-xs text-mute">{formatDate(o.createdAt)}</p>
                    </td>
                    <td className="py-3">{o.customer?.name}</td>
                    <td className="py-3"><StatusBadge status={o.status} /></td>
                    <td className="py-3 text-right font-medium">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6">
            <h2 className="font-display text-xl">Top products</h2>
            <ol className="mt-4 space-y-3">
              {s.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 text-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cream text-xs font-semibold">{i + 1}</span>
                  <span className="flex-1 truncate">{p.name.replace(/^Dermisque\s+/i, "")}</span>
                  <span className="text-mute">{p.units} sold</span>
                  <span className="w-20 text-right font-medium">{formatPrice(p.revenue)}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-3xl bg-white p-6">
            <h2 className="flex items-center gap-2 font-display text-xl">
              <AlertTriangle className="size-4 text-sun" /> Low stock
            </h2>
            {s.lowStock.length === 0 ? (
              <p className="mt-3 text-sm text-mute">All products are well stocked.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {s.lowStock.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 text-sm hover:underline">
                      <span className="relative size-9 overflow-hidden rounded-lg bg-sand">
                        <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />
                      </span>
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className={cn("font-medium", p.stock === 0 ? "text-red-600" : "text-[#a15c00]")}>{p.stock} left</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
