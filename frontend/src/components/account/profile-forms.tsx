"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePassword, updateProfile } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ProfileForms({ user }: { user: User }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [saving, startSave] = useTransition();
  const [changing, startChange] = useTransition();

  return (
    <div className="space-y-6">
      <form
        className="rounded-3xl bg-white p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          startSave(async () => {
            const res = await updateProfile({ name, phone });
            if (res.ok) toast.success("Profile updated");
            else toast.error(res.error);
          });
        }}
      >
        <h2 className="font-display text-2xl">Personal details</h2>
        <p className="mt-1 text-sm text-mute">Member since {formatDate(user.createdAt)}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Full name</span>
            <input className="input" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            <span className="label">Phone</span>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Email</span>
            <input className="input bg-cream text-mute" value={user.email} disabled />
          </label>
        </div>
        <Button className="mt-6" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />} Save changes
        </Button>
      </form>

      <form
        className="rounded-3xl bg-white p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (pw.next !== pw.confirm) return toast.error("New passwords don't match");
          startChange(async () => {
            const res = await changePassword({ currentPassword: pw.current, newPassword: pw.next });
            if (res.ok) {
              toast.success("Password changed");
              setPw({ current: "", next: "", confirm: "" });
            } else toast.error(res.error);
          });
        }}
      >
        <h2 className="font-display text-2xl">Change password</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {(
            [
              ["current", "Current password"],
              ["next", "New password"],
              ["confirm", "Confirm new password"],
            ] as const
          ).map(([k, label]) => (
            <label key={k}>
              <span className="label">{label}</span>
              <input
                type="password"
                className="input"
                required
                minLength={k === "current" ? 1 : 8}
                value={pw[k]}
                onChange={(e) => setPw({ ...pw, [k]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-mute">At least 8 characters with a letter and a number.</p>
        <Button className="mt-6" disabled={changing}>
          {changing && <Loader2 className="size-4 animate-spin" />} Update password
        </Button>
      </form>
    </div>
  );
}
