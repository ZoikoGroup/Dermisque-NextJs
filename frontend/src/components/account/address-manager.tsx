"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAddress, saveAddress } from "@/app/actions/store";
import { Button } from "@/components/ui/button";
import type { Address, AddressInput } from "@/lib/types";

const blank: AddressInput = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
  isDefault: false,
};

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl">Addresses</h2>
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Add address
        </Button>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <AddressForm
              initial={editing === "new" ? blank : editing}
              onCancel={() => setEditing(null)}
              onSave={(data) =>
                start(async () => {
                  const res = await saveAddress(data, editing === "new" ? undefined : editing.id);
                  if (res.ok) {
                    toast.success("Address saved");
                    setEditing(null);
                  } else toast.error(res.error);
                })
              }
              pending={pending}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {addresses.length === 0 && !editing ? (
        <div className="rounded-3xl bg-white p-14 text-center">
          <MapPin className="mx-auto size-10 text-mute" />
          <p className="mt-4 text-ink-soft">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <motion.div layout key={a.id} className="ring-brand relative rounded-3xl bg-white p-6">
              {a.isDefault && (
                <span className="absolute right-5 top-5 flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[0.7rem] font-semibold">
                  <Star className="size-3" /> Default
                </span>
              )}
              <p className="font-medium">{a.fullName}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
                <br />
                {a.city}, {a.state} {a.postalCode}
                <br />
                {a.country}
              </p>
              <p className="mt-1 text-sm text-mute">{a.phone}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
                {!a.isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      start(async () => {
                        const res = await saveAddress({ ...a, isDefault: true }, a.id);
                        if (res.ok) toast.success("Default address updated");
                        else toast.error(res.error);
                      })
                    }
                  >
                    Make default
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (!confirm("Delete this address?")) return;
                    start(async () => {
                      const res = await deleteAddress(a.id);
                      if (res.ok) toast.success("Address deleted");
                      else toast.error(res.error);
                    });
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddressForm({
  initial,
  onSave,
  onCancel,
  pending,
}: {
  initial: AddressInput;
  onSave: (a: AddressInput) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [f, setF] = useState<AddressInput>(initial);
  const field = (k: keyof AddressInput, label: string, opts: { wide?: boolean; required?: boolean } = {}) => (
    <label className={opts.wide ? "sm:col-span-2" : ""}>
      <span className="label">{label}</span>
      <input
        className="input"
        required={opts.required !== false}
        value={(f[k] as string) ?? ""}
        onChange={(e) => setF({ ...f, [k]: e.target.value })}
      />
    </label>
  );
  return (
    <form
      className="rounded-3xl bg-white p-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...f, line2: f.line2 || null });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {field("fullName", "Full name")}
        {field("phone", "Phone")}
        {field("line1", "Address line 1", { wide: true })}
        {field("line2", "Address line 2 (optional)", { wide: true, required: false })}
        {field("city", "City")}
        {field("state", "State / County")}
        {field("postalCode", "Postal code")}
        {field("country", "Country")}
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-ink" checked={!!f.isDefault} onChange={(e) => setF({ ...f, isDefault: e.target.checked })} />
        Set as default address
      </label>
      <div className="mt-6 flex gap-3">
        <Button disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" />} Save address</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
