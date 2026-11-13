import Link from "next/link";
import { ArrowRight, MapPin, Package, Sparkles, Wallet } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/misc";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { api } from "@/lib/api";
import type { Address, Order } from "@/lib/types";
import { Price } from "@/components/store/currency-provider";
import { formatOrderMoney } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

export default async function AccountOverview() {
  const [orders, addresses] = await Promise.all([
    api<Order[]>("/api/account/orders"),
    api<Address[]>("/api/account/addresses"),
  ]);
  const active = orders.filter((o) => ["PENDING", "PROCESSING", "SHIPPED"].includes(o.status));
  const spent = orders.filter((o) => o.status !== "CANCELLED").reduce((n, o) => n + o.total, 0);

  return (
    <div className="space-y-8">
      <Stagger className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Package, label: "Total orders", value: orders.length },
          { icon: Sparkles, label: "In progress", value: active.length },
          { icon: Wallet, label: "Total spent", value: <Price cents={spent} /> },
        ].map(({ icon: Icon, label, value }) => (
          <StaggerItem key={label}>
            <div className="ring-brand group rounded-3xl bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft transition-transform duration-500 group-hover:rotate-12">
                <Icon className="size-5" />
              </span>
              <p className="mt-5 font-display text-3xl">{value}</p>
              <p className="text-sm text-mute">{label}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <section className="rounded-3xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Recent orders</h2>
          <Link href="/account/orders" className="flex items-center gap-1 text-sm hover:underline">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-ink-soft">You haven&apos;t placed any orders yet.</p>
            <ButtonLink href="/shop" className="mt-4">Start shopping</ButtonLink>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {orders.slice(0, 4).map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.orderNumber}`} className="group flex flex-wrap items-center gap-4 py-4">
                  <span className="font-mono text-sm font-medium">{o.orderNumber}</span>
                  <span className="text-sm text-mute">{formatDate(o.createdAt)}</span>
                  <StatusBadge status={o.status} />
                  <span className="ml-auto font-medium">{formatOrderMoney(o.total, o)}</span>
                  <ArrowRight className="size-4 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Default address</h2>
          <Link href="/account/addresses" className="text-sm hover:underline">Manage</Link>
        </div>
        {addresses[0] ? (
          <p className="mt-4 flex gap-3 text-sm text-ink-soft">
            <MapPin className="size-4 shrink-0" />
            {(() => {
              const a = addresses.find((x) => x.isDefault) ?? addresses[0];
              return `${a.fullName}, ${a.line1}, ${a.city}, ${a.state} ${a.postalCode}, ${a.country}`;
            })()}
          </p>
        ) : (
          <p className="mt-4 text-sm text-mute">No saved addresses yet.</p>
        )}
      </section>
    </div>
  );
}
