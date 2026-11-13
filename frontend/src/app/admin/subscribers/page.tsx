import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Subscribers" };

export default async function Subscribers() {
  const rows = await api<{ id: string; email: string; createdAt: string }[]>("/api/admin/subscribers");
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">{rows.length} newsletter subscribers</p>
      <div className="overflow-hidden rounded-3xl bg-white">
        {rows.length === 0 ? (
          <p className="p-16 text-center text-mute">No subscribers yet. Sign-ups from the footer appear here.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-mute">
              <tr>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 text-right font-medium">Subscribed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-cream">
                  <td className="px-6 py-3"><a href={`mailto:${r.email}`} className="hover:underline">{r.email}</a></td>
                  <td className="px-6 py-3 text-right text-ink-soft">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
