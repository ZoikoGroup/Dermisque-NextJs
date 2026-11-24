"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { api, attempt } from "@/lib/api";
import { getSession } from "@/lib/auth";
import type { AppliedCoupon } from "@/lib/pricing";
import type { Address, AddressInput, Order } from "@/lib/types";

/* ───────────── Newsletter & messages ───────────── */
export async function subscribe(email: string) {
  return attempt(() => api("/api/subscribe", { method: "POST", auth: false, body: { email } }));
}

export type ConsultationDetails = {
  dateOfBirth: string;
  gender: string | null;
  address: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  previousConsultation: string | null;
  medications: string | null;
  recentTreatments: string | null;
  consentOnline: boolean;
  infoAccurate: boolean;
};

export async function sendMessage(data: {
  type: "CONTACT" | "CONSULTATION";
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  details?: ConsultationDetails;
}) {
  const clean = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === "" ? null : v]));
  return attempt(() => api("/api/messages", { method: "POST", auth: false, body: clean }));
}

/* ───────────── Reviews ───────────── */
export async function addReview(slug: string, input: { rating: number; title?: string; body: string }) {
  if (!(await getSession())) return { ok: false as const, error: "Please sign in to write a review" };
  const res = await attempt(() =>
    api(`/api/products/${encodeURIComponent(slug)}/reviews`, {
      method: "POST",
      body: { ...input, title: input.title || null },
    }),
  );
  if (res.ok) revalidatePath(`/product/${slug}`);
  return res;
}

/* ───────────── Checkout ───────────── */
export async function validateCoupon(code: string, subtotal: number) {
  return attempt(() =>
    api<AppliedCoupon & { description: string | null }>("/api/checkout/coupon", {
      method: "POST",
      body: { code, subtotal },
    }),
  );
}

export type PlaceOrderInput = {
  items: { id: string; quantity: number }[];
  address: AddressInput;
  saveAddress?: boolean;
  paymentMethod: "CARD" | "COD";
  card?: { number: string; expiry: string; cvc: string; name: string };
  coupon?: string | null;
  notes?: string;
  currency?: "USD" | "GBP";
  /** Stripe PaymentIntent the customer already confirmed */
  paymentIntentId?: string;
};

export type PaymentIntentInput = {
  items: { id: string; quantity: number }[];
  coupon?: string | null;
  currency: "USD" | "GBP";
  paymentIntentId?: string | null;
};

/** Prices the bag on the server and returns a Stripe client secret for it. */
export async function createPaymentIntent(input: PaymentIntentInput) {
  return attempt(() =>
    api<{ clientSecret: string; paymentIntentId: string; amount: number; currency: string }>(
      "/api/checkout/payment-intent",
      { method: "POST", body: input },
    ),
  );
}

export async function placeOrder(input: PlaceOrderInput) {
  const res = await attempt(() => api<Order>("/api/checkout/orders", { method: "POST", body: input }));
  if (res.ok) {
    revalidatePath("/account", "layout");
    revalidatePath("/shop");
  }
  return res;
}

/* ───────────── Account ───────────── */
export async function saveAddress(input: AddressInput, id?: string) {
  const res = await attempt(() =>
    api<Address>(id ? `/api/account/addresses/${id}` : "/api/account/addresses", {
      method: id ? "PUT" : "POST",
      body: input,
    }),
  );
  if (res.ok) revalidatePath("/account/addresses");
  return res;
}

export async function deleteAddress(id: string) {
  const res = await attempt(() => api(`/api/account/addresses/${id}`, { method: "DELETE" }));
  if (res.ok) revalidatePath("/account/addresses");
  return res;
}

export async function cancelOrder(orderNumber: string) {
  const res = await attempt(() =>
    api<Order>(`/api/account/orders/${encodeURIComponent(orderNumber)}/cancel`, { method: "POST" }),
  );
  if (res.ok) revalidatePath("/account", "layout");
  return res;
}

/* ───────────── Server cart (abandoned-cart reminders, cross-device bag) ───────────── */
export type ServerCartLine = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  quantity: number;
};

export async function getServerCart() {
  if (!(await getSession())) return [] as ServerCartLine[];
  return attempt(() => api<ServerCartLine[]>("/api/account/cart")).then((r) => (r.ok ? r.data : []));
}

export async function saveServerCart(items: { id: string; quantity: number }[]) {
  if (!(await getSession())) return;
  await attempt(() => api("/api/account/cart", { method: "PUT", body: { items } }));
}

/* ───────────── Shop assistant (chatbot) ───────────── */
export type ChatProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  stock: number;
  rating: number | null;
  tagline: string;
};

export type ChatReply = { reply: string; products: ChatProduct[]; suggestions: string[]; mode: "ai" | "assistant" };

export async function askAssistant(messages: { role: "user" | "assistant"; content: string }[]) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return attempt(() =>
    api<ChatReply>("/api/chat", { method: "POST", body: { messages }, headers: { "x-shopper-ip": ip } }),
  );
}
