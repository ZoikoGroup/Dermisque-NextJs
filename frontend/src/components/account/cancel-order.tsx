"use client";

import { useTransition } from "react";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cancelOrder } from "@/app/actions/store";
import { Button } from "@/components/ui/button";

export function CancelOrderButton({ orderNumber }: { orderNumber: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (!confirm("Cancel this order? Any payment will be refunded.")) return;
        start(async () => {
          const res = await cancelOrder(orderNumber);
          if (res.ok) toast.success("Order cancelled");
          else toast.error(res.error);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />} Cancel order
    </Button>
  );
}
