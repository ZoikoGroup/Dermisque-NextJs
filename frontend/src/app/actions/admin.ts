"use server";

import { revalidatePath } from "next/cache";
import { api, attempt } from "@/lib/api";
import { getSession } from "@/lib/auth";
import type { BlogPost, Coupon, Order, ProductDetail } from "@/lib/types";

async function guard() {
  const s = await getSession();
  if (s?.role !== "ADMIN") throw new Error("Admin access required");
}

const refreshCatalog = (slug?: string) => {
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  if (slug) revalidatePath(`/product/${slug}`);
};

export type ProductPayload = {
  name: string;
  slug?: string;
  tagline?: string | null;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  gallery: string[];
  ingredients: { name: string; detail: string }[];
  benefits: string[];
  howToUse: string[];
  faqs: { q: string; a: string }[];
  size?: string | null;
  stock: number;
  featured: boolean;
  isActive: boolean;
  categoryIds: string[];
};

export async function saveProduct(data: ProductPayload, id?: string) {
  return attempt(async () => {
    await guard();
    const p = await api<ProductDetail>(id ? `/api/admin/products/${id}` : "/api/admin/products", {
      method: id ? "PUT" : "POST",
      body: data,
    });
    refreshCatalog(p.slug);
    return { id: p.id, slug: p.slug };
  });
}

export async function deleteProduct(id: string) {
  return attempt(async () => {
    await guard();
    await api(`/api/admin/products/${id}`, { method: "DELETE" });
    refreshCatalog();
  });
}

export async function uploadImage(formData: FormData) {
  return attempt(async () => {
    await guard();
    const fd = new FormData();
    fd.set("file", formData.get("file") as Blob);
    return api<{ url: string }>("/api/admin/upload", { method: "POST", body: fd });
  });
}

export async function updateOrder(
  orderNumber: string,
  patch: { status?: string; paymentStatus?: string; trackingNumber?: string },
) {
  return attempt(async () => {
    await guard();
    const o = await api<Order>(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, {
      method: "PATCH",
      body: patch,
    });
    revalidatePath("/admin", "layout");
    return o;
  });
}

export type CouponPayload = Omit<Coupon, "id" | "usedCount" | "createdAt">;

export async function saveCoupon(data: CouponPayload, id?: string) {
  return attempt(async () => {
    await guard();
    await api(id ? `/api/admin/coupons/${id}` : "/api/admin/coupons", { method: id ? "PUT" : "POST", body: data });
    revalidatePath("/admin/coupons");
  });
}

export async function deleteCoupon(id: string) {
  return attempt(async () => {
    await guard();
    await api(`/api/admin/coupons/${id}`, { method: "DELETE" });
    revalidatePath("/admin/coupons");
  });
}

export async function setMessageStatus(id: string, status: "NEW" | "READ" | "RESOLVED") {
  return attempt(async () => {
    await guard();
    await api(`/api/admin/messages/${id}`, { method: "PATCH", body: { status } });
    revalidatePath("/admin", "layout");
  });
}

export async function deleteMessage(id: string) {
  return attempt(async () => {
    await guard();
    await api(`/api/admin/messages/${id}`, { method: "DELETE" });
    revalidatePath("/admin/messages");
  });
}

export async function toggleReview(id: string, slug: string) {
  return attempt(async () => {
    await guard();
    await api(`/api/admin/reviews/${id}`, { method: "PATCH" });
    revalidatePath("/admin/reviews");
    revalidatePath(`/product/${slug}`);
  });
}

export async function deleteReview(id: string, slug: string) {
  return attempt(async () => {
    await guard();
    await api(`/api/admin/reviews/${id}`, { method: "DELETE" });
    revalidatePath("/admin/reviews");
    revalidatePath(`/product/${slug}`);
  });
}

/* ───────────── Blog ───────────── */
export type BlogPayload = {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  authorName?: string;
  status: "DRAFT" | "PUBLISHED";
  featured: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  productIds: string[];
  publishedAt?: string | null;
};

const refreshBlog = (slug?: string) => {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/");
  if (slug) revalidatePath(`/blog/${slug}`);
};

export async function saveBlogPost(data: BlogPayload, id?: string) {
  return attempt(async () => {
    await guard();
    const post = await api<BlogPost>(id ? `/api/admin/blog/${id}` : "/api/admin/blog", {
      method: id ? "PUT" : "POST",
      body: data,
    });
    refreshBlog(post.slug);
    return { id: post.id, slug: post.slug, status: post.status };
  });
}

export async function deleteBlogPost(id: string) {
  return attempt(async () => {
    await guard();
    await api(`/api/admin/blog/${id}`, { method: "DELETE" });
    refreshBlog();
  });
}

/* ───────────── Emails ───────────── */
export async function sendTestEmail(template: string, to: string) {
  return attempt(async () => {
    await guard();
    return api<{ status: string; error: string | null }>("/api/admin/emails/test", {
      method: "POST",
      body: { template, to },
    });
  });
}
