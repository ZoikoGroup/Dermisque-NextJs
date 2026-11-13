import { notFound } from "next/navigation";
import { BlogEditor } from "@/components/admin/blog-editor";
import { api, apiOrNull } from "@/lib/api";
import type { BlogCard, BlogPost, ProductCardData } from "@/lib/types";

export const metadata = { title: "Edit post" };

export default async function EditPost({ params }: PageProps<"/admin/blog/[id]">) {
  const { id } = await params;
  const [post, products, posts] = await Promise.all([
    apiOrNull<BlogPost>(`/api/admin/blog/${id}`),
    api<ProductCardData[]>("/api/admin/products"),
    api<BlogCard[]>("/api/admin/blog"),
  ]);
  if (!post) notFound();
  return <BlogEditor post={post} products={products} categories={[...new Set(posts.map((p) => p.category))]} />;
}
