export default function Loading() {
  return (
    <div className="container-luxe grid gap-10 py-16 lg:grid-cols-2 lg:gap-16">
      <div className="skeleton aspect-square !rounded-[2rem]" />
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="skeleton h-6 w-20 !rounded-full" />
          <div className="skeleton h-6 w-24 !rounded-full" />
        </div>
        <div className="skeleton h-12 w-4/5" />
        <div className="skeleton h-5 w-2/3" />
        <div className="skeleton h-9 w-32" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-28 w-full !rounded-3xl" />
        <div className="skeleton h-14 w-full !rounded-full" />
        <div className="skeleton h-14 w-full !rounded-full" />
      </div>
    </div>
  );
}
