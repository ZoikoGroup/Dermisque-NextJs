"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct } from "@/app/actions/admin";

export function DeleteProductButton({ id, name, redirectTo }: { id: string; name: string; redirectTo?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Delete ${name}`}
      className="grid size-9 place-items-center rounded-full text-red-600 transition hover:bg-red-600 hover:text-white"
      onClick={() => {
        if (!confirm(`Delete "${name}"? Past orders keep their own record of it. Tip: hide it instead to keep it reversible.`)) return;
        start(async () => {
          const res = await deleteProduct(id);
          if (res.ok) {
            toast.success("Product deleted");
            if (redirectTo) router.push(redirectTo);
          } else toast.error(res.error);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}
