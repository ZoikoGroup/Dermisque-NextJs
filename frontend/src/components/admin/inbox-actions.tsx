"use client";

import { useTransition } from "react";
import { Check, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMessage, deleteReview, setMessageStatus, toggleReview } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function ReviewActions({ id, slug, approved }: { id: string; slug: string; approved: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await toggleReview(id, slug);
            if (res.ok) toast.success(approved ? "Review hidden" : "Review published");
            else toast.error(res.error);
          })
        }
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : approved ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {approved ? "Hide" : "Publish"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-red-600 hover:bg-red-50"
        disabled={pending}
        aria-label="Delete review"
        onClick={() => {
          if (!confirm("Delete this review permanently?")) return;
          start(async () => {
            const res = await deleteReview(id, slug);
            if (res.ok) toast.success("Review deleted");
            else toast.error(res.error);
          });
        }}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

export function MessageActions({ id, status }: { id: string; status: "NEW" | "READ" | "RESOLVED" }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) toast.success(msg);
      else toast.error(res.error);
    });
  return (
    <div className="flex flex-wrap gap-1">
      {status === "NEW" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setMessageStatus(id, "READ"), "Marked as read")}>
          <Eye className="size-3.5" /> Mark read
        </Button>
      )}
      {status !== "RESOLVED" && (
        <Button size="sm" disabled={pending} onClick={() => run(() => setMessageStatus(id, "RESOLVED"), "Marked resolved")}>
          <Check className="size-3.5" /> Resolve
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="text-red-600 hover:bg-red-50"
        disabled={pending}
        aria-label="Delete message"
        onClick={() => confirm("Delete this message?") && run(() => deleteMessage(id), "Message deleted")}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
