import Image from "@/components/ui/product-image";
import Link from "next/link";
import { Pencil, Plus, Star } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/delete-product";
import { ButtonLink } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { ProductCardData } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

export const metadata = { title: "Products" };

export default async function AdminProducts({ searchParams }: PageProps<"/admin/products">) {
  const { q } = await searchParams;
  const products = await api<ProductCardData[]>("/api/admin/products", { query: { q: typeof q === "string" ? q : undefined } });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <form action="/admin/products" className="w-full sm:w-72">
          <input name="q" defaultValue={typeof q === "string" ? q : ""} placeholder="Search products…" className="input !rounded-full" />
        </form>
        <ButtonLink href="/admin/products/new" className="ml-auto">
          <Plus className="size-4" /> Add product
        </ButtonLink>
      </div>

      <div className="overflow-x-auto rounded-3xl bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-mute">
            <tr>
              <th className="px-6 py-4 font-medium">Product</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium">Stock</th>
              <th className="px-6 py-4 font-medium">Rating</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => (
              <tr key={p.id} className="transition hover:bg-cream">
                <td className="px-6 py-3">
                  <Link href={`/admin/products/${p.id}`} className="group flex items-center gap-3">
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-sand">
                      <Image src={p.image} alt="" fill sizes="48px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    </span>
                    <span>
                      <span className="flex items-center gap-1.5 font-medium group-hover:underline">
                        {p.name}
                        {p.featured && <Star className="size-3.5 fill-amber text-amber" aria-label="Featured" />}
                      </span>
                      <span className="text-xs text-mute">{p.concerns.join(", ") || "—"}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-3 font-medium">{formatPrice(p.price)}</td>
                <td className={cn("px-6 py-3", p.stock === 0 ? "text-red-600" : p.stock <= 15 ? "text-[#a15c00]" : "")}>{p.stock}</td>
                <td className="px-6 py-3 text-ink-soft">{p.reviewCount ? `${p.rating.toFixed(1)} (${p.reviewCount})` : "—"}</td>
                <td className="px-6 py-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600")}>
                    {p.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/products/${p.id}`} className="grid size-9 place-items-center rounded-full transition hover:bg-ink hover:text-white" aria-label="Edit">
                      <Pencil className="size-4" />
                    </Link>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
