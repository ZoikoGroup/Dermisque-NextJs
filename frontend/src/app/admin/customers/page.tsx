import { StatusBadge } from "@/components/ui/misc";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default async function Customers({ searchParams }: PageProps<"/admin/customers">) {
  const { q } = await searchParams;
  const rows = await api<Customer[]>("/api/admin/customers", { query: { q: typeof q === "string" ? q : undefined } });

  return (
    <div className="space-y-5">
      <form action="/admin/customers" className="w-full sm:w-72">
        <input name="q" defaultValue={typeof q === "string" ? q : ""} placeholder="Search name or email…" className="input !rounded-full" />
      </form>
      <div className="overflow-x-auto rounded-3xl bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-mute">
            <tr>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Phone</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Joined</th>
              <th className="px-6 py-4 text-right font-medium">Orders</th>
              <th className="px-6 py-4 text-right font-medium">Total spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((c) => (
              <tr key={c.id} className="transition hover:bg-cream">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-brand-soft font-semibold">{c.name.charAt(0)}</span>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <a href={`mailto:${c.email}`} className="text-xs text-mute hover:underline">{c.email}</a>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-ink-soft">{c.phone ?? "—"}</td>
                <td className="px-6 py-4"><StatusBadge status={c.role} /></td>
                <td className="px-6 py-4 text-ink-soft">{formatDate(c.createdAt)}</td>
                <td className="px-6 py-4 text-right">
                  {c.orderCount > 0 ? (
                    <a href={`/admin/orders?q=${encodeURIComponent(c.email)}`} className="hover:underline">{c.orderCount}</a>
                  ) : (
                    0
                  )}
                </td>
                <td className="px-6 py-4 text-right font-medium">{formatPrice(c.totalSpent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
