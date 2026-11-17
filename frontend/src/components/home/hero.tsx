"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const GREEN = "#0f3d35";
const GOLD = "#b8955a";

const ingredients = ["Vitamin C", "Niacinamide", "Hyaluronic Acid", "24KT Gold", "Retinol", "Aloe Vera"];

const stats = [
  ["3X", "Formulation philosophy"],
  ["12", "Targeted serums"],
  ["Skin", "Concern-led discovery"],
];

export function Hero() {
  // wait for the intro curtain on a first visit; animate almost immediately afterwards
  const [b] = useState(() => {
    try {
      return sessionStorage.getItem("dq-intro") ? 0 : 1.3;
    } catch {
      return 0;
    }
  });
  const rise = (d: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay: b + d, ease },
  });

  return (
    <section className="relative overflow-hidden lg:flex lg:min-h-[max(520px,calc(100svh-7.5rem))] lg:flex-col bg-[linear-gradient(120deg,#f6ece0_0%,#efe0cc_45%,#f4ead9_70%,#e9eadb_100%)]">
      {/* backdrop: soft light, gold arcs and a hint of greenery top-right */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 size-[520px] rounded-full bg-white/60 blur-[110px]" />
        <div className="absolute -right-16 -top-24 size-[460px] rounded-full bg-[#9db27a]/45 blur-[90px]" />
        <div className="absolute right-[18%] top-[-6%] size-[220px] rounded-full bg-[#c7d3a4]/50 blur-[70px]" />
        <div className="absolute -bottom-40 right-1/4 size-[480px] rounded-full bg-[#f3d9b4]/60 blur-[120px]" />
        <svg className="absolute inset-0 size-full" viewBox="0 0 1440 760" preserveAspectRatio="none" fill="none">
          <motion.path
            d="M770 0 C 880 220, 1000 470, 1440 600"
            stroke={GOLD}
            strokeOpacity="0.55"
            strokeWidth="1.4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.2, delay: b + 0.2, ease }}
          />
          <motion.path
            d="M300 760 C 620 600, 1000 520, 1440 380"
            stroke={GOLD}
            strokeOpacity="0.35"
            strokeWidth="1.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.4, delay: b + 0.4, ease }}
          />
        </svg>
      </div>

      <div className="mx-auto w-full max-w-[112rem] px-4 sm:px-6 lg:px-10 2xl:px-[4.5rem] relative grid items-center gap-12 py-12 lg:flex-1 lg:grid-cols-[auto_auto] lg:justify-center lg:gap-[clamp(3rem,6vw,8rem)] lg:py-[2.5vh]">
        {/* copy panel */}
        <div className="relative rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.55),rgba(255,255,255,0.15))] p-6 sm:p-10 lg:-ml-10 lg:rounded-none lg:bg-[linear-gradient(90deg,rgba(255,255,255,0.45),rgba(255,255,255,0))] lg:w-[min(52rem,46vw)] lg:py-[3vh] lg:pl-10">
          <motion.p
            {...rise(0.1)}
            className="inline-flex items-center gap-2.5 rounded-full border bg-white/60 py-2 pl-3 pr-8 text-[0.72rem] font-semibold uppercase tracking-[0.06em] backdrop-blur"
            style={{ borderColor: GOLD, color: GREEN }}
          >
            <span className="size-3.5 rounded-full" style={{ background: GREEN }} />
            The Dermisque philosophy
          </motion.p>

          <h1 className="mt-9 lg:mt-[3.2vh] font-display text-[clamp(2.2rem,9.5vw,2.8rem)] leading-[1.12] sm:text-[clamp(2.8rem,5.4vw,5rem)] lg:text-[min(5vw,8.4vh)]" style={{ color: GREEN }}>
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, delay: b + 0.2, ease }}
              >
                Science of skin.
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-4">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, delay: b + 0.32, ease }}
              >
                Sum of{" "}
                <span className="relative inline-block">
                  <span className="bg-[linear-gradient(90deg,#b8955a_0%,#a9935c_45%,#3f8f84_100%)] bg-clip-text pr-2 italic text-transparent">
                    beauty.
                  </span>
                  <motion.span
                    aria-hidden
                    className="absolute -bottom-3 left-0 h-[3px] w-[120%] origin-left rounded-full"
                    style={{ background: GOLD }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: b + 1, ease }}
                  />
                </span>
              </motion.span>
            </span>
          </h1>

          <motion.p {...rise(0.6)} className="mt-8 max-w-[34rem] text-lg leading-relaxed text-ink-soft sm:text-[1.3rem] lg:mt-[2.6vh] lg:text-[min(1.3rem,2.4vh)]">
            Premium skincare and hair care with thoughtfully paired actives, crafted for your individual beauty ritual.
          </motion.p>

          <motion.div {...rise(0.75)} className="mt-10 flex flex-wrap gap-4 lg:mt-[3.6vh] lg:flex-nowrap">
            <Link
              href="/shop"
              className="group inline-flex h-16 items-center gap-10 shrink-0 rounded-full pl-9 pr-7 text-lg lg:gap-6 xl:gap-10 lg:h-[min(4rem,6.8vh)] lg:text-[min(1.125rem,2.1vh)] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(15,61,53,0.8)] transition hover:brightness-125"
              style={{ background: GREEN }}
            >
              Shop All Serums
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/consultation"
              className="inline-flex h-16 items-center rounded-full border-2 bg-white/70 px-7 text-lg lg:h-[min(4rem,6.8vh)] lg:text-[min(1.125rem,2.1vh)] font-semibold shrink-0 whitespace-nowrap backdrop-blur transition hover:bg-white sm:pr-24 lg:pr-10 2xl:pr-24"
              style={{ borderColor: GOLD, color: GREEN }}
            >
              Free Skin Consultation
            </Link>
          </motion.div>

          <motion.dl {...rise(0.9)} className="mt-14 grid max-w-[44rem] grid-cols-3 border-t border-[#d6c6ad] pt-5 lg:mt-[4.2vh] lg:pt-[1.8vh]">
            {stats.map(([n, l]) => (
              <div key={l} className="pr-3">
                <dt className="font-display text-3xl lg:text-[min(1.875rem,3.5vh)]" style={{ color: GREEN }}>
                  {n}
                </dt>
                <dd className="mt-2 text-sm text-ink-soft sm:text-base lg:mt-[0.6vh] lg:text-[min(1rem,1.9vh)]">{l}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* imagery */}
        <div className="relative mx-auto w-full max-w-[44rem] lg:w-[min(48rem,40vw,calc((94svh_-_260px)/0.98))] lg:max-w-none">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: b + 0.25, ease }}
            className="relative overflow-hidden rounded-[2rem] border-[6px] border-white bg-white shadow-[0_40px_80px_-40px_rgba(60,40,10,0.55)]"
          >
            <Link href="/product/24kt-gold-serum" className="group relative block aspect-[1.36] lg:aspect-[1.5]">
              <Image
                src="/products/gold-serum.jpg"
                alt="Dermisque 24KT Gold Face Serum"
                fill
                preload
                sizes="(min-width:1024px) 46vw, 94vw"
                className="object-cover object-[50%_40%] transition-transform duration-[1.4s] ease-[var(--ease-luxe)] group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
              <span className="absolute inset-x-5 bottom-[5%] flex flex-col items-start gap-2 sm:inset-x-6 sm:gap-3">
                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/90 sm:text-xl lg:text-[min(1.25rem,2.4vh)]">
                  New icon
                </span>
                <span
                  className="w-full whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white sm:ml-[6%] sm:w-[82%] sm:text-base lg:py-[1.2vh] lg:text-[min(1rem,1.9vh)]"
                  style={{ background: GREEN }}
                >
                  24KT Gold Serum <span className="mx-1.5 opacity-70">/</span> Dermisque
                </span>
              </span>
            </Link>
          </motion.div>

          <div className="mt-5 grid grid-cols-2 gap-5 sm:pl-[4%]">
            {[
              { src: "/products/gold-serum.jpg", alt: "24KT Gold Face Serum on a stone pedestal", href: "/product/24kt-gold-serum", pos: "object-[50%_55%]" },
              { src: "/products/hair-growth.webp", alt: "Dermisque 3X Hair Growth Serum", href: "/product/hair-growth-serum", pos: "object-center" },
            ].map((im, i) => (
              <motion.div
                key={im.src}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: b + 0.5 + i * 0.12, ease }}
                className="overflow-hidden rounded-[1.6rem] border-[5px] border-white bg-white shadow-[0_30px_60px_-35px_rgba(60,40,10,0.55)]"
              >
                <Link href={im.href} className="group relative block aspect-[1.65]">
                  <Image
                    src={im.src}
                    alt={im.alt}
                    fill
                    sizes="(min-width:1024px) 22vw, 46vw"
                    className={`object-cover ${im.pos} transition-transform duration-[1.2s] ease-[var(--ease-luxe)] group-hover:scale-110`}
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* key ingredients */}
      <div className="relative border-t border-white/60 bg-[#fbf8f2]/90 backdrop-blur">
        <div className="mx-auto w-full max-w-[112rem] px-4 sm:px-6 lg:px-10 2xl:px-[4.5rem] flex flex-col gap-4 py-5 lg:flex-row lg:py-[1.8vh] lg:items-center lg:gap-10">
          <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.04em]" style={{ color: GOLD }}>
            Explore key ingredients
          </p>
          <ul className="flex flex-wrap items-center gap-x-10 gap-y-2 lg:flex-1 lg:justify-between">
            {ingredients.map((a) => (
              <li key={a}>
                <Link
                  href={`/shop?q=${encodeURIComponent(a)}`}
                  className="flex items-center gap-3 font-display text-lg text-ink-soft transition-colors hover:text-[#0f3d35] sm:text-xl"
                >
                  <span className="size-1.5 rounded-full" style={{ background: GOLD }} />
                  {a}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
