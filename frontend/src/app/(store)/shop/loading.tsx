import { ProductCardSkeleton } from "@/components/product/product-card";

export default function Loading() {
  return (
    <div className="container-luxe pb-10 pt-12">
      <div className="skeleton mb-3 h-3 w-32" />
      <div className="skeleton mb-4 h-14 w-80 max-w-full" />
      <div className="skeleton mb-10 h-4 w-[28rem] max-w-full" />
      <div className="skeleton h-28 w-full !rounded-3xl" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
