import Image from "next/image";
import { Suspense } from "react";
import Link from "next/link";
import { FlaskConical, Heart, Layers, Rabbit, ShieldCheck, Sprout, UserRound, LockKeyhole } from "lucide-react";
import { AuthTabs, LanguagePill } from "@/components/auth/auth-shell";

const BADGES = [
  { icon: FlaskConical, label: ["Science-Backed", "Formulas"] },
  { icon: Sprout, label: ["Clinically", "Inspired"] },
  { icon: ShieldCheck, label: ["Gentle &", "Effective"] },
  { icon: Rabbit, label: ["Cruelty-Free", "& Responsible"] },
];

const PERKS = [
  { icon: LockKeyhole, label: ["Secure", "Sign-In"] },
  { icon: Layers, label: ["Your Orders", "& History"] },
  { icon: Heart, label: ["Saved", "Favorites"] },
  { icon: UserRound, label: ["Personalized", "Recommendations"] },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-[radial-gradient(ellipse_at_30%_40%,#1d5c4f_0%,#0f3d35_45%,#0a2a24_100%)]">
      {/* soft foliage light */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 size-[420px] rounded-full bg-[#5f9a3c]/45 blur-[90px]" />
        <div className="absolute left-[38%] top-[8%] size-[280px] rounded-full bg-[#7fb069]/25 blur-[90px]" />
        <div className="absolute -bottom-32 left-[10%] size-[460px] rounded-full bg-[#2f7d5d]/40 blur-[110px]" />
        <div className="absolute -right-40 top-0 h-full w-[55%] bg-[linear-gradient(90deg,transparent,#efe6d6_45%,#f6efe3)] max-lg:hidden" />
      </div>

      {/* full-bleed product photograph behind the brand story (desktop) */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[54%] max-lg:hidden">
        <Image
          src="/login/vitamin-c-glow-display.jpg"
          alt=""
          fill
          priority
          sizes="54vw"
          className="object-cover object-[55%_60%]"
        />
        {/* keep the copy legible and melt the right edge into the page */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,40,33,0.55)_0%,rgba(8,40,33,0.15)_42%,transparent_60%,rgba(6,32,26,0.55)_100%)]" />
        <div className="absolute inset-y-0 right-0 w-[18%] bg-[linear-gradient(90deg,transparent,#0f3d35)]" />
      </div>

      <div className="relative mx-auto grid min-h-svh max-w-[110rem] items-center gap-8 px-4 py-6 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 sm:py-[1.8vh] xl:px-12">
        {/* brand story */}
        <section className="relative hidden self-stretch text-white lg:flex lg:flex-col lg:py-[2vh]">
          <Link href="/" aria-label="Dermisque home" className="relative z-10 mx-auto">
            <Image src="/logo-light.png" alt="Dermisque" width={1128} height={236} priority className="h-auto w-[min(19rem,22vw,30vh)]" />
          </Link>
          <h1 className="relative z-10 mt-[3.5vh] font-display text-[clamp(2.4rem,min(3.9vw,7vh),4.4rem)] leading-[1.05]">
            Three actives.
            <br />
            One sum of{" "}
            <span className="relative inline-block italic text-[#e3bd6c]">
              beauty.
              <svg aria-hidden viewBox="0 0 220 20" className="absolute -bottom-3 left-[-8%] h-4 w-[115%]" preserveAspectRatio="none">
                <path d="M4 15 C 70 4, 150 2, 216 9" fill="none" stroke="#e3bd6c" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="relative z-10 mt-[3.5vh] max-w-md [text-shadow:0_2px_12px_rgba(0,0,0,0.35)] border-l-[3px] border-[#e3bd6c] pl-5 text-[clamp(0.95rem,min(1.15vw,2.1vh),1.2rem)] leading-relaxed text-white/90">
            Premium 3X skincare &amp; hair care serums. Clinically inspired formulas for glowing, healthy, younger-looking skin.
          </p>

          <div className="flex-1" />

          <ul className="relative z-10 mt-[3vh] grid grid-cols-4 divide-x divide-white/30 [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]">
            {BADGES.map(({ icon: Icon, label }) => (
              <li key={label[0]} className="flex flex-col items-center px-2 text-center">
                <Icon className="size-[min(2.25rem,4.2vh)] text-[#e3bd6c]" strokeWidth={1.4} />
                <span className="mt-2 text-[clamp(0.8rem,min(1vw,1.9vh),1.05rem)] leading-tight">
                  {label[0]}
                  <br />
                  {label[1]}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* account card */}
        <section className="relative mx-auto w-full max-w-[46rem] rounded-[2rem] border border-white/70 bg-[#fbf6ee] p-5 sm:py-[2vh] shadow-[0_40px_90px_-40px_rgba(0,0,0,0.55)] sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" aria-label="Dermisque home">
              <Image src="/logo.png" alt="Dermisque" width={1128} height={236} priority className="h-auto w-40 sm:w-[min(14rem,20vh)]" />
            </Link>
            <LanguagePill />
          </div>
          <Suspense fallback={<div className="mt-6 h-[5.5rem]" />}>
            <AuthTabs />
          </Suspense>
          <div className="px-1 pt-6 sm:px-6 sm:pt-[2.2vh]">{children}</div>
          <ul className="[@media(max-height:700px)_and_(max-width:1279px)]:hidden mt-7 grid grid-cols-2 gap-y-4 rounded-3xl bg-[#f3ebdd] px-4 py-4 sm:mt-[2.2vh] sm:py-[1.5vh] sm:grid-cols-4 sm:divide-x sm:divide-[#d9cbb2]">
            {PERKS.map(({ icon: Icon, label }) => (
              <li key={label[0]} className="flex items-center justify-center gap-2.5 px-2">
                <Icon className="size-7 shrink-0 text-[#0f3d35]" strokeWidth={1.5} />
                <span className="text-[0.82rem] leading-tight text-ink">
                  {label[0]}
                  <br />
                  {label[1]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
