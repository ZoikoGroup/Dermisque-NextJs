import Image from "@/components/ui/product-image";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/misc";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatOrderMoney } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "My orders" };

export default async function OrdersPage() {
  const orders = await api<Order[]>("/api/account/orders");

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-14 text-center">
        <Package className="mx-auto size-10 text-mute" />
        <p className="mt-4 font-display text-2xl">No orders yet</p>
        <ButtonLink href="/shop" className="mt-6">Shop serums</ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <Link
          key={o.id}
          href={`/account/orders/${o.orderNumber}`}
          className="ring-brand group block rounded-3xl bg-white p-5 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="font-mono text-sm font-semibold">{o.orderNumber}</span>
            <span className="text-sm text-mute">{formatDate(o.createdAt)}</span>
            <StatusBadge status={o.status} />
            <span className="ml-auto text-lg font-semibold">{formatOrderMoney(o.total, o)}</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {o.items.slice(0, 5).map((i) => (
              <div key={i.id} className="relative size-14 overflow-hidden rounded-xl bg-sand">
                <Image src={i.image} alt={i.name} fill sizes="56px" className="object-cover" />
              </div>
            ))}
            <span className="ml-2 text-sm text-ink-soft">
              {o.items.reduce((n, i) => n + i.quantity, 0)} items
            </span>
            <span className="ml-auto flex items-center gap-1 text-sm font-medium">
              Details <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
