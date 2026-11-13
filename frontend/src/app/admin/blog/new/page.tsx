import { BlogEditor } from "@/components/admin/blog-editor";
import { api } from "@/lib/api";
import type { BlogCard, ProductCardData } from "@/lib/types";

export const metadata = { title: "New post" };

export default async function NewPost() {
  const [products, posts] = await Promise.all([
    api<ProductCardData[]>("/api/admin/products"),
    api<BlogCard[]>("/api/admin/blog"),
  ]);
  return <BlogEditor products={products} categories={[...new Set(posts.map((p) => p.category))]} />;
}
