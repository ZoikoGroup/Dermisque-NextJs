export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-32 !rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="skeleton h-80 !rounded-3xl" />
        <div className="skeleton h-80 !rounded-3xl" />
      </div>
      <div className="skeleton h-72 !rounded-3xl" />
    </div>
  );
}
