"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCoupon, saveCoupon, type CouponPayload } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import type { Coupon } from "@/lib/types";
import { cn, formatDate, formatPrice } from "@/lib/utils";

const blank: CouponPayload = {
  code: "",
  description: "",
  type: "PERCENT",
  value: 10,
  minOrder: 0,
  usageLimit: null,
  firstOrderOnly: false,
  active: true,
  expiresAt: null,
};

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" /> New coupon
        </Button>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CouponForm
              key={editing === "new" ? "new" : editing.id}
              initial={editing === "new" ? blank : editing}
              pending={pending}
              onCancel={() => setEditing(null)}
              onSave={(data) =>
                start(async () => {
                  const res = await saveCoupon(data, editing === "new" ? undefined : editing.id);
                  if (res.ok) {
                    toast.success("Coupon saved");
                    setEditing(null);
                  } else toast.error(res.error);
                })
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {coupons.map((c) => (
          <div key={c.id} className="ring-brand relative overflow-hidden rounded-3xl bg-white p-6">
            <div className="absolute -right-6 -top-6 size-24 rounded-full bg-brand opacity-20" />
            <div className="flex items-start justify-between">
              <span className="rounded-xl border-2 border-dashed border-ink/20 px-3 py-1 font-mono text-lg font-semibold tracking-widest">{c.code}</span>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", c.active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600")}>
                {c.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-4 font-display text-3xl">{c.type === "PERCENT" ? `${c.value}% off` : `${formatPrice(c.value)} off`}</p>
            <p className="text-sm text-ink-soft">{c.description || "—"}</p>
            <ul className="mt-4 space-y-1 text-xs text-mute">
              <li>Used {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""} times</li>
              {c.minOrder > 0 && <li>Minimum order {formatPrice(c.minOrder)}</li>}
              {c.firstOrderOnly && <li>First order only</li>}
              {c.expiresAt && <li>Expires {formatDate(c.expiresAt)}</li>}
            </ul>
            <div className="mt-5 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                <Pencil className="size-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (!confirm(`Delete coupon ${c.code}?`)) return;
                  start(async () => {
                    const res = await deleteCoupon(c.id);
                    if (res.ok) toast.success("Coupon deleted");
                    else toast.error(res.error);
                  });
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CouponForm({
  initial,
  onSave,
  onCancel,
  pending,
}: {
  initial: CouponPayload;
  onSave: (d: CouponPayload) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [f, setF] = useState({
    ...initial,
    valueInput: initial.type === "FIXED" ? (initial.value / 100).toFixed(2) : String(initial.value),
    minOrderInput: initial.minOrder ? (initial.minOrder / 100).toFixed(2) : "",
    expiresInput: initial.expiresAt ? initial.expiresAt.slice(0, 10) : "",
  });

  return (
    <form
      className="rounded-3xl bg-white p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const value = f.type === "FIXED" ? Math.round(parseFloat(f.valueInput) * 100) : parseInt(f.valueInput);
        if (!value || value < 1) return toast.error("Enter a discount value");
        onSave({
          code: f.code.trim().toUpperCase(),
          description: f.description || null,
          type: f.type,
          value,
          minOrder: f.minOrderInput ? Math.round(parseFloat(f.minOrderInput) * 100) : 0,
          usageLimit: f.usageLimit || null,
          firstOrderOnly: f.firstOrderOnly,
          active: f.active,
          expiresAt: f.expiresInput ? new Date(f.expiresInput + "T23:59:59Z").toISOString() : null,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label>
          <span className="label">Code</span>
          <input className="input font-mono uppercase" required minLength={3} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
        </label>
        <label>
          <span className="label">Type</span>
          <select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as "PERCENT" | "FIXED" })}>
            <option value="PERCENT">Percent off</option>
            <option value="FIXED">Fixed amount ($)</option>
          </select>
        </label>
        <label>
          <span className="label">{f.type === "PERCENT" ? "Percent" : "Amount (USD)"}</span>
          <input className="input" type="number" min="0" step={f.type === "PERCENT" ? 1 : 0.01} max={f.type === "PERCENT" ? 100 : undefined} required value={f.valueInput} onChange={(e) => setF({ ...f, valueInput: e.target.value })} />
        </label>
        <label>
          <span className="label">Minimum order (USD)</span>
          <input className="input" type="number" min="0" step="0.01" value={f.minOrderInput} onChange={(e) => setF({ ...f, minOrderInput: e.target.value })} placeholder="None" />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Description</span>
          <input className="input" value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </label>
        <label>
          <span className="label">Usage limit</span>
          <input className="input" type="number" min="1" value={f.usageLimit ?? ""} onChange={(e) => setF({ ...f, usageLimit: e.target.value ? parseInt(e.target.value) : null })} placeholder="Unlimited" />
        </label>
        <label>
          <span className="label">Expires on</span>
          <input className="input" type="date" value={f.expiresInput} onChange={(e) => setF({ ...f, expiresInput: e.target.value })} />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4 accent-ink" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-4 accent-ink" checked={f.firstOrderOnly} onChange={(e) => setF({ ...f, firstOrderOnly: e.target.checked })} /> First order only
        </label>
      </div>
      <div className="mt-6 flex gap-3">
        <Button disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" />} Save coupon</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
