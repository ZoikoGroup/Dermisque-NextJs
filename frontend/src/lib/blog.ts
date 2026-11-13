import "server-only";
import { api, apiOrNull } from "./api";
import type { BlogCard, BlogDetail, Page } from "./types";

export function getBlogPosts(q: { category?: string; tag?: string; q?: string; page?: number; pageSize?: number } = {}) {
  return api<Page<BlogCard>>("/api/blog", { query: q, auth: false });
}

export function getBlogCategories() {
  return api<{ name: string; count: number }[]>("/api/blog/categories", { auth: false });
}

export function getBlogPost(slug: string) {
  return apiOrNull<BlogDetail>(`/api/blog/${encodeURIComponent(slug)}`, { auth: false });
}
