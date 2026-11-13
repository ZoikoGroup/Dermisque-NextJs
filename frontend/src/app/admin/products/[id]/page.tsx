import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { apiOrNull } from "@/lib/api";
import { getCategories } from "@/lib/queries";
import type { ProductDetail } from "@/lib/types";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    apiOrNull<ProductDetail>(`/api/admin/products/${id}`),
    getCategories(),
  ]);
  if (!product) notFound();
  return <ProductForm categories={categories} product={product} />;
}
