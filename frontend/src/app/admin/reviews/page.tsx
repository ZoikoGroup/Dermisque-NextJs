import Link from "next/link";
import { ReviewActions } from "@/components/admin/inbox-actions";
import { Stars } from "@/components/ui/misc";
import { api } from "@/lib/api";
import type { AdminReview } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Reviews" };

export default async function Reviews() {
  const reviews = await api<AdminReview[]>("/api/admin/reviews");
  if (reviews.length === 0) {
    return <div className="rounded-3xl bg-white p-16 text-center text-mute">No reviews yet. Reviews customers write on product pages appear here.</div>;
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {reviews.map((r) => (
        <article key={r.id} className={`rounded-3xl bg-white p-6 ${r.approved ? "" : "opacity-70 ring-2 ring-amber/40"}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Stars value={r.rating} />
              <Link href={`/product/${r.productSlug}`} className="mt-1 block text-xs text-mute hover:underline">{r.productName}</Link>
            </div>
            <span className="text-xs text-mute">{formatDate(r.createdAt)}</span>
          </div>
          {r.title && <p className="mt-3 font-medium">{r.title}</p>}
          <p className="mt-1 text-sm text-ink-soft">{r.body}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium">— {r.userName}</span>
            <ReviewActions id={r.id} slug={r.productSlug} approved={r.approved} />
          </div>
        </article>
      ))}
    </div>
  );
}
