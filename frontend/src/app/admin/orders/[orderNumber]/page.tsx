import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { OrderControls } from "@/components/admin/order-controls";
import { OrderSummary, OrderTimeline } from "@/components/account/order-summary";
import { apiOrNull } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default async function AdminOrder({ params }: PageProps<"/admin/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  const order = await apiOrNull<Order>(`/api/admin/orders/${encodeURIComponent(orderNumber)}`);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" /> All orders
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Order {order.orderNumber}</h2>
          <p className="text-sm text-mute">Placed {formatDate(order.createdAt)} · updated {formatDate(order.updatedAt)}</p>
        </div>
        {order.customer && (
          <a href={`mailto:${order.customer.email}?subject=Your Dermisque order ${order.orderNumber}`} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm hover:bg-ink hover:text-white">
            <Mail className="size-4" /> Email {order.customer.name}
          </a>
        )}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <OrderTimeline order={order} />
          <OrderSummary order={order} admin />
          {order.notes && (
            <div className="rounded-3xl bg-white p-6 text-sm">
              <p className="font-display text-xl">Customer notes</p>
              <p className="mt-2 text-ink-soft">{order.notes}</p>
            </div>
          )}
        </div>
        <OrderControls order={order} />
      </div>
    </div>
  );
}
