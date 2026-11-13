import "server-only";
import { api, apiOrNull } from "./api";
import type { Category, ProductCardData, ProductDetail } from "./types";

export type { ProductCardData } from "./types";

export type ShopFilters = {
  q?: string;
  concern?: string;
  sort?: string;
  min?: number;
  max?: number;
};

export function getProducts(f: ShopFilters = {}) {
  return api<ProductCardData[]>("/api/products", { query: f, auth: false });
}

export function getFeaturedProducts(limit = 8) {
  return api<ProductCardData[]>("/api/products", { query: { featured: true, limit }, auth: false });
}

export function getCategories() {
  return api<Category[]>("/api/categories", { auth: false });
}

export function getProductBySlug(slug: string) {
  return apiOrNull<ProductDetail>(`/api/products/${encodeURIComponent(slug)}`, { auth: false });
}

export function getRelatedProducts(slug: string, limit = 4) {
  return api<ProductCardData[]>(`/api/products/${encodeURIComponent(slug)}/related`, {
    query: { limit },
    auth: false,
  });
}
