import Image from "next/image";

export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="relative grid size-20 place-items-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-line border-t-sun border-r-aqua" />
        <Image src="/sigma.png" alt="Loading" width={36} height={36} className="animate-pulse" />
      </div>
    </div>
  );
}
