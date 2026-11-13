import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center bg-cream px-6 text-center">
      <div>
        <Image src="/sigma.png" alt="" width={90} height={90} className="mx-auto animate-float" />
        <p className="mt-6 font-display text-8xl">404</p>
        <p className="mt-2 font-display text-2xl">This page has gone missing</p>
        <p className="mt-2 text-ink-soft">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/">Back home</ButtonLink>
          <ButtonLink href="/shop" variant="outline">Shop serums</ButtonLink>
        </div>
      </div>
    </div>
  );
}
