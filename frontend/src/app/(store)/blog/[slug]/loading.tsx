export default function Loading() {
  return (
    <div className="container-luxe pt-10">
      <div className="skeleton h-4 w-28" />
      <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-4">
        <div className="skeleton h-7 w-28 !rounded-full" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-3/4" />
        <div className="skeleton h-5 w-2/3" />
      </div>
      <div className="skeleton mx-auto mt-10 aspect-[16/9] max-w-5xl !rounded-[2.5rem]" />
      <div className="mx-auto mt-12 max-w-3xl space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
