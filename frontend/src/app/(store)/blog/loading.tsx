import { BlogCardSkeleton } from "@/components/blog/blog-card";

export default function Loading() {
  return (
    <div className="container-luxe py-12">
      <div className="skeleton mb-3 h-3 w-40" />
      <div className="skeleton mb-4 h-14 w-96 max-w-full" />
      <div className="skeleton h-4 w-[30rem] max-w-full" />
      <div className="mt-8 flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-9 w-28 !rounded-full" />
        ))}
      </div>
      <div className="skeleton mt-10 aspect-[4/5] !rounded-[2.25rem] sm:aspect-[21/9]" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <BlogCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
