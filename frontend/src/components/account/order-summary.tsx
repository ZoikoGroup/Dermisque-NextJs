import Image from "@/components/ui/product-image";
import Link from "next/link";
import { Check, Package, Truck, Home, XCircle, Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/misc";
import type { Order } from "@/lib/types";
import { formatOrderMoney } from "@/lib/currency";
import { cn, formatDate, formatPrice } from "@/lib/utils";

const steps = [
  { key: "PENDING", label: "Order placed", icon: Clock },
  { key: "PROCESSING", label: "Processing", icon: Package },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Home },
] as const;

export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-3xl bg-red-50 p-5 text-red-700">
        <XCircle className="size-6" />
        <div>
          <p className="font-medium">This order was cancelled</p>
          {order.paymentStatus === "REFUNDED" && <p className="text-sm">Your payment has been refunded.</p>}
        </div>
      </div>
    );
  }
  const current = steps.findIndex((s) => s.key === order.status);
  return (
    <div className="rounded-3xl bg-white p-6">
      <ol className="relative grid grid-cols-4">
        <div className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-all duration-1000"
            style={{ width: `${(Math.max(0, current) / (steps.length - 1)) * 100}%` }}
          />
        </div>
        {steps.map((s, i) => {
          const done = i <= current;
          return (
            <li key={s.key} className="relative flex flex-col items-center text-center">
              <span
                className={cn(
                  "grid size-10 place-items-center rounded-full border-4 border-white transition-colors",
                  done ? "bg-ink text-white" : "bg-line text-mute",
                  i === current && "ring-4 ring-amber/30",
                )}
              >
                {done && i < current ? <Check className="size-4" /> : <s.icon className="size-4" />}
              </span>
              <span className={cn("mt-2 text-xs sm:text-sm", done ? "font-medium" : "text-mute")}>{s.label}</span>
            </li>
          );
        })}
      </ol>
      {order.trackingNumber && (
        <p className="mt-6 rounded-2xl bg-cream px-4 py-3 text-sm">
          Tracking number: <span className="font-mono font-medium">{order.trackingNumber}</span>
        </p>
      )}
    </div>
  );
}

export function OrderSummary({ order, admin }: { order: Order; admin?: boolean }) {
  const a = order.address;
  // Customers see the currency they paid in; admin reports stay in USD.
  const money = (cents: number) => (admin ? formatPrice(cents) : formatOrderMoney(cents, order));
  return (
    <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
      <div className="rounded-3xl bg-white p-6">
        <div className="flex items-center justify-between">
          <p className="font-display text-xl">Items</p>
          <StatusBadge status={order.status} />
        </div>
        <ul className="mt-5 divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex-1">
                {i.slug ? (
                  <Link href={`/product/${i.slug}`} className="text-sm font-medium hover:underline">
                    {i.name}
                  </Link>
                ) : (
                  <p className="text-sm font-medium">{i.name}</p>
                )}
                <p className="text-xs text-mute">
                  {money(i.price)} × {i.quantity}
                </p>
              </div>
              <span className="text-sm font-medium">{money(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <Row k="Subtotal" v={money(order.subtotal)} />
          {order.discount > 0 && <Row k={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} v={`−${money(order.discount)}`} />}
          <Row k="Shipping" v={order.shipping ? money(order.shipping) : "Free"} />
          {order.tax > 0 && <Row k="Tax" v={money(order.tax)} />}
          <div className="flex justify-between pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{money(order.total)}</dd>
          </div>
          {admin && order.currency && order.currency !== "USD" && (
            <p className="rounded-xl bg-sand px-3 py-2 text-xs text-ink-soft">
              Customer paid <b>{formatOrderMoney(order.total, order)}</b> in {order.currency} (rate {order.fxRate}).
            </p>
          )}
        </dl>
      </div>
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 text-sm">
          <p className="font-display text-xl">Shipping to</p>
          <p className="mt-3 font-medium">{a.fullName}</p>
          <p className="text-ink-soft">
            {a.line1}
            {a.line2 ? `, ${a.line2}` : ""}
            <br />
            {a.city}, {a.state} {a.postalCode}
            <br />
            {a.country}
          </p>
          <p className="mt-2 text-ink-soft">{a.phone}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 text-sm">
          <p className="font-display text-xl">Payment</p>
          <div className="mt-3 flex items-center justify-between">
            <span>{order.paymentMethod === "CARD" ? "Card" : "Cash on delivery"}</span>
            <StatusBadge status={order.paymentStatus} />
          </div>
          <p className="mt-2 text-mute">Placed {formatDate(order.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
