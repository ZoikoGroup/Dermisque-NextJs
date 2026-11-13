"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateOrder } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { ORDER_STATUSES } from "@/lib/site";
import type { Order } from "@/lib/types";

export function OrderControls({ order }: { order: Order }) {
  const [status, setStatus] = useState(order.status);
  const [payment, setPayment] = useState(order.paymentStatus);
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [pending, start] = useTransition();
  const locked = order.status === "CANCELLED";

  return (
    <form
      className="sticky top-24 space-y-4 rounded-3xl bg-white p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (status === "CANCELLED" && order.status !== "CANCELLED" && !confirm("Cancel this order? Stock will be restored and paid orders marked refunded."))
          return;
        start(async () => {
          const res = await updateOrder(order.orderNumber, {
            status: status !== order.status ? status : undefined,
            paymentStatus: payment !== order.paymentStatus ? payment : undefined,
            trackingNumber: tracking,
          });
          if (res.ok) toast.success("Order updated");
          else toast.error(res.error);
        });
      }}
    >
      <p className="font-display text-xl">Manage order</p>
      <label className="block">
        <span className="label">Fulfilment status</span>
        <select className="input" value={status} disabled={locked} onChange={(e) => setStatus(e.target.value as Order["status"])}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Payment status</span>
        <select className="input" value={payment} disabled={locked} onChange={(e) => setPayment(e.target.value as Order["paymentStatus"])}>
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </label>
      <label className="block">
        <span className="label">Tracking number</span>
        <input className="input font-mono" value={tracking} disabled={locked} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. 1Z999AA10123456784" />
      </label>
      {locked ? (
        <p className="text-sm text-mute">Cancelled orders can&apos;t be changed.</p>
      ) : (
        <Button className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />} Save changes
        </Button>
      )}
      {order.paymentMethod === "COD" && !locked && (
        <p className="text-xs text-mute">Marking a COD order as Delivered also marks it Paid.</p>
      )}
    </form>
  );
}
