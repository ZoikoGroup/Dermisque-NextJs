import Image from "next/image";
import { Logo } from "@/components/ui/misc";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="absolute inset-0 animate-gradient bg-brand bg-[length:200%_200%] opacity-90" />
        <div className="absolute inset-0 grid place-items-center p-16">
          <div className="relative w-full max-w-md">
            <div className="animate-float overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-2xl">
              <Image src="/products/vitamin-c.webp" alt="" width={600} height={600} preload />
            </div>
            <div className="absolute -bottom-8 -left-10 w-44 animate-float overflow-hidden rounded-3xl border-4 border-white shadow-2xl [animation-delay:-3s]">
              <Image src="/products/under-eye.jpg" alt="" width={300} height={300} />
            </div>
          </div>
        </div>
        <p className="absolute bottom-10 left-10 max-w-sm font-display text-3xl leading-tight text-ink">
          “Three actives. One sum of beauty.”
        </p>
      </div>
      <div className="flex flex-col bg-cream">
        <div className="p-6 sm:p-10">
          <Logo className="w-40" />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
