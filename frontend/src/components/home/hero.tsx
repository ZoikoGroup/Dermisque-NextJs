"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowRight, FlaskConical, Layers, Leaf, Rabbit } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const ingredients = ["Vitamin C", "Niacinamide", "Hyaluronic Acid", "24KT Gold", "Retinol", "Glutathione", "Redensyl", "Aloe Vera"];

const stats = [
  { icon: FlaskConical, value: "12", label: "targeted serums" },
  { icon: Layers, value: "3X", label: "actives per formula" },
  { icon: Rabbit, value: "100%", label: "cruelty-free" },
];

/** Four-point gold sparkle used between ingredients. */
const Sparkle = () => (
  <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 text-[#d79a2b]" fill="currentColor" aria-hidden>
    <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z" />
  </svg>
);

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
    <section className="relative overflow-hidden bg-[#fbf1e6] lg:flex lg:min-h-[max(540px,calc(100svh-7.5rem))] lg:flex-col">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-0 size-[520px] rounded-full bg-white/70 blur-[110px] max-lg:hidden" />
      {/* photograph: full-bleed on the right, fading into the cream on the left */}
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, delay: b, ease }}
        className="relative h-[52vw] max-h-[26rem] min-h-[15rem] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:max-h-none lg:w-[62%]"
      >
        <Image
          src="/home/gold-serum-glow.jpg"
          alt="Woman with glowing skin beside the Dermisque 24KT Gold Face Serum and box"
          fill
          preload
          sizes="(min-width:1024px) 62vw, 100vw"
          className="object-cover object-[60%_30%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#fbf1e6_0%,rgba(251,241,230,0.55)_7%,rgba(251,241,230,0)_18%)] max-lg:bg-[linear-gradient(0deg,#fbf1e6_0%,rgba(251,241,230,0)_35%)]" />
      </motion.div>

      {/* rotating "3X triple-action" seal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1, delay: b + 0.9, ease }}
        className="absolute right-[3%] top-[3%] z-10 grid size-24 place-items-center rounded-full border-2 border-[#d9a441] bg-[radial-gradient(circle,#2a1f14_0%,#120d08_100%)] text-[#e9bd5c] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] sm:size-32 lg:top-[7%] lg:size-[min(12rem,21vh)]"
      >
        <svg viewBox="0 0 100 100" className="absolute inset-[6%] animate-spin-slow" aria-hidden>
          <defs>
            <path id="dq-seal-3x" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
          </defs>
          <text className="fill-current text-[9.5px] font-semibold uppercase tracking-[0.18em]">
            <textPath href="#dq-seal-3x" textLength="232" lengthAdjust="spacing">
              Science of skin • Triple-action •
            </textPath>
          </text>
        </svg>
        <span className="font-display text-3xl font-semibold italic sm:text-4xl lg:text-[min(3.4rem,5.8vh)]">3X</span>
      </motion.div>

      {/* copy */}
      <div className="relative mx-auto w-full max-w-[112rem] flex-1 px-4 sm:px-6 lg:flex lg:items-center lg:px-10 2xl:px-[4.5rem]">
        <div className="relative z-10 py-8 lg:w-[48%] lg:py-[3vh]">
          <motion.p
            {...rise(0.1)}
            className="inline-flex items-center gap-3 rounded-full border border-[#e3cfae] bg-white/75 py-2 pl-2 pr-6 text-sm font-medium shadow-sm backdrop-blur sm:text-base lg:text-[min(1.05rem,2vh)]"
          >
            <span className="grid size-7 place-items-center rounded-full bg-[linear-gradient(135deg,#a4c639,#4c9a2a)] text-white">
              <Leaf className="size-4" />
            </span>
            <span>
              Premium <b>3X</b> skincare &amp; hair care serums
            </span>
          </motion.p>

          <h1 className="mt-6 font-display text-[clamp(2.6rem,9vw,3.4rem)] font-medium leading-[1.04] tracking-tight text-ink sm:text-[clamp(3rem,6vw,5.2rem)] lg:mt-[3vh] lg:text-[min(5.4vw,9.6vh)]">
            <span className="block overflow-hidden pb-1">
              <motion.span className="block" initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1.1, delay: b + 0.2, ease }}>
                Science of skin.
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.18em]">
              <motion.span className="block" initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1.1, delay: b + 0.32, ease }}>
                Sum of{" "}
                <span className="relative inline-block">
                  <span className="bg-[linear-gradient(95deg,#e59a12_0%,#d9a62a_35%,#79b33f_70%,#16b3c4_100%)] bg-clip-text pr-[0.08em] italic text-transparent">
                    beauty.
                  </span>
                  <svg aria-hidden viewBox="0 0 300 24" className="absolute -bottom-[0.16em] left-[-4%] h-[0.22em] w-[110%]" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="dq-swoosh" x1="0" x2="1">
                        <stop offset="0" stopColor="#e59a12" />
                        <stop offset="0.6" stopColor="#79b33f" />
                        <stop offset="1" stopColor="#16b3c4" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d="M4 18 C 90 6, 200 4, 296 10"
                      fill="none"
                      stroke="url(#dq-swoosh)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2, delay: b + 1, ease }}
                    />
                  </svg>
                </span>
              </motion.span>
            </span>
          </h1>

          <motion.p
            {...rise(0.6)}
            className="mt-5 max-w-[36rem] text-lg leading-relaxed text-ink-soft sm:text-xl lg:mt-[2.4vh] lg:text-[min(1.35rem,2.5vh)]"
          >
            Every Dermisque serum pairs three powerful actives — a triple-action formula for glowing, healthy,
            younger-looking skin and fuller hair.
          </motion.p>

          <motion.div {...rise(0.75)} className="mt-7 flex flex-wrap gap-4 lg:mt-[3.4vh] lg:flex-nowrap">
            <Link
              href="/shop"
              className="group inline-flex h-14 shrink-0 items-center gap-3 rounded-full border border-[#c99a3b] bg-[linear-gradient(180deg,#2c2218_0%,#0d0a07_100%)] px-8 text-lg font-medium text-white shadow-[0_14px_30px_-12px_rgba(120,80,20,0.7),inset_0_1px_0_rgba(255,220,150,0.25)] transition hover:brightness-125 lg:h-[min(4rem,7vh)] lg:text-[min(1.3rem,2.4vh)]"
            >
              Shop All Serums
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/consultation"
              className="inline-flex h-14 shrink-0 items-center rounded-full border-2 border-[#e2c896] bg-[#fdf8f1]/90 px-8 text-lg font-medium text-ink backdrop-blur transition hover:border-[#c99a3b] hover:bg-white lg:h-[min(4rem,7vh)] lg:text-[min(1.3rem,2.4vh)]"
            >
              Free Skin Consultation
            </Link>
          </motion.div>

          <motion.dl {...rise(0.9)} className="mt-8 grid max-w-[42rem] grid-cols-3 divide-x divide-[#e3cfae] lg:mt-[4vh]">
            {stats.map(({ icon: Icon, value, label }, i) => (
              <div key={label} className={i ? "flex items-center gap-3 pl-3 sm:pl-6" : "flex items-center gap-3 pr-3"}>
                <Icon className="size-8 shrink-0 text-[#c98a2e] max-sm:hidden lg:size-[min(2.4rem,4.4vh)]" strokeWidth={1.4} />
                <div>
                  <dt className="font-display text-3xl font-medium text-ink sm:text-4xl lg:text-[min(2.6rem,4.8vh)]">{value}</dt>
                  <dd className="text-sm text-ink-soft sm:text-base lg:text-[min(1rem,1.9vh)]">{label}</dd>
                </div>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>

      {/* key ingredients */}
      <div className="relative z-10 mx-auto w-full max-w-[112rem] px-4 pb-5 sm:px-6 lg:px-10 lg:pb-[2.4vh] 2xl:px-[4.5rem]">
        <motion.ul
          {...rise(1)}
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-[2rem] border border-[#ead9bd] bg-[#fdf8f1]/85 px-5 py-3 shadow-[0_10px_30px_-20px_rgba(120,80,20,0.5)] backdrop-blur sm:rounded-full lg:flex-nowrap lg:justify-between lg:px-12 lg:py-[1.6vh]"
        >
          {ingredients.map((a, i) => (
            <li key={a} className="flex items-center gap-5">
              {i > 0 && <Sparkle />}
              <Link
                href={`/shop?q=${encodeURIComponent(a)}`}
                className="whitespace-nowrap font-display text-base text-ink transition-colors hover:text-[#c98a2e] sm:text-lg lg:text-[min(1.3rem,2.4vh)]"
              >
                {a}
              </Link>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
