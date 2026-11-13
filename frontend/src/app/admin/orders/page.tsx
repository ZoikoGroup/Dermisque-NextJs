import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { StatusBadge } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { ORDER_STATUSES } from "@/lib/site";
import type { Order, Page } from "@/lib/types";
import { cn, formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Orders" };

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await api<Page<Order>>("/api/admin/orders", { query: { status, q, page, pageSize: 15 } });
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const href = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, q, page, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && !(k === "page" && v === 1)) p.set(k, String(v));
    return `/admin/orders${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-full bg-white p-1">
          {[undefined, ...ORDER_STATUSES].map((s) => (
            <Link
              key={s ?? "all"}
              href={href({ status: s, page: 1 })}
              className={cn("rounded-full px-4 py-2 text-xs font-medium transition", status === s ? "bg-ink text-white" : "hover:bg-cream")}
            >
              {s ? s.charAt(0) + s.slice(1).toLowerCase() : "All"}
            </Link>
          ))}
        </div>
        <form className="relative ml-auto w-full sm:w-72" action="/admin/orders">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mute" />
          <input name="q" defaultValue={q} placeholder="Order #, name or email" className="input !rounded-full pl-10" />
        </form>
      </div>

      <div className="overflow-x-auto rounded-3xl bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-mute">
            <tr>
              <th className="px-6 py-4 font-medium">Order</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Items</th>
              <th className="px-6 py-4 font-medium">Payment</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-mute">No orders found.</td>
              </tr>
            )}
            {data.items.map((o) => (
              <tr key={o.id} className="group transition hover:bg-cream">
                <td className="px-6 py-4">
                  <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono font-medium group-hover:underline">{o.orderNumber}</Link>
                  <p className="text-xs text-mute">{formatDate(o.createdAt)}</p>
                </td>
                <td className="px-6 py-4">
                  <p>{o.customer?.name}</p>
                  <p className="text-xs text-mute">{o.customer?.email}</p>
                </td>
                <td className="px-6 py-4">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td className="px-6 py-4">
                  <p className="text-xs text-mute">{o.paymentMethod === "CARD" ? "Card" : "COD"}</p>
                  <StatusBadge status={o.paymentStatus} />
                </td>
                <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                <td className="px-6 py-4 text-right font-semibold">{formatPrice(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-ink-soft">
        <span>{data.total} orders</span>
        <div className="flex items-center gap-2">
          <Link aria-disabled={page <= 1} href={href({ page: page - 1 })} className={cn("grid size-9 place-items-center rounded-full bg-white", page <= 1 && "pointer-events-none opacity-40")}>
            <ChevronLeft className="size-4" />
          </Link>
          <span>Page {page} of {pages}</span>
          <Link aria-disabled={page >= pages} href={href({ page: page + 1 })} className={cn("grid size-9 place-items-center rounded-full bg-white", page >= pages && "pointer-events-none opacity-40")}>
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
