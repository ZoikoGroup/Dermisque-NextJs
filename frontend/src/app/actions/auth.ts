"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, attempt } from "@/lib/api";
import { clearSession, setSessionToken } from "@/lib/auth";
import type { User } from "@/lib/types";

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

type AuthResponse = { accessToken: string; user: User };

function safeNext(next: FormDataEntryValue | null, fallback: string) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const res = await attempt(() =>
    api<AuthResponse>("/api/auth/login", {
      method: "POST",
      auth: false,
      body: { email: String(formData.get("email") ?? "").trim(), password: String(formData.get("password") ?? "") },
    }),
  );
  if (!res.ok) return { error: res.error };
  await setSessionToken(res.data.accessToken);
  redirect(safeNext(formData.get("next"), res.data.user.role === "ADMIN" ? "/admin" : "/account"));
}

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Please enter your full name";
  if (!/^\S+@\S+\.\S+$/.test(email)) fieldErrors.email = "Enter a valid email";
  if (password.length < 8) fieldErrors.password = "Use at least 8 characters";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    fieldErrors.password = "Include a letter and a number";
  if (password !== confirm) fieldErrors.confirm = "Passwords don't match";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const res = await attempt(() =>
    api<AuthResponse>("/api/auth/register", { method: "POST", auth: false, body: { name, email, password } }),
  );
  if (!res.ok) {
    return /email/i.test(res.error) ? { fieldErrors: { email: res.error } } : { error: res.error };
  }
  await setSessionToken(res.data.accessToken);
  redirect(safeNext(formData.get("next"), "/account"));
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function updateProfile(input: { name: string; phone?: string }) {
  const res = await attempt(() =>
    api<AuthResponse>("/api/auth/me", { method: "PATCH", body: { name: input.name, phone: input.phone || null } }),
  );
  if (!res.ok) return res;
  await setSessionToken(res.data.accessToken); // token carries the new name
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  return attempt(() => api("/api/auth/change-password", { method: "POST", body: input }));
}

/* ───────────── Password reset ───────────── */
export async function requestPasswordReset(email: string) {
  return attempt(() => api("/api/auth/forgot-password", { method: "POST", auth: false, body: { email } }));
}

export async function resetPassword(token: string, password: string) {
  return attempt(() => api("/api/auth/reset-password", { method: "POST", auth: false, body: { token, password } }));
}
