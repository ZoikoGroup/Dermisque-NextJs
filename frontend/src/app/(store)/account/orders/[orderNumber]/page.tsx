import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CancelOrderButton } from "@/components/account/cancel-order";
import { OrderSummary, OrderTimeline } from "@/components/account/order-summary";
import { apiOrNull } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default async function OrderDetail({ params }: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  const order = await apiOrNull<Order>(`/api/account/orders/${encodeURIComponent(orderNumber)}`);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" /> All orders
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Order {order.orderNumber}</h2>
          <p className="text-sm text-mute">Placed on {formatDate(order.createdAt)}</p>
        </div>
        {["PENDING", "PROCESSING"].includes(order.status) && <CancelOrderButton orderNumber={order.orderNumber} />}
      </div>
      <OrderTimeline order={order} />
      <OrderSummary order={order} />
      {order.notes && (
        <div className="rounded-3xl bg-white p-6 text-sm">
          <p className="font-display text-xl">Notes</p>
          <p className="mt-2 text-ink-soft">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
