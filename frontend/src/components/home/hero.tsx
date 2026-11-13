"use client";

import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useState } from "react";
import { ArrowRight, Droplets, FlaskConical, Leaf, Sparkles, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const ease = [0.22, 1, 0.36, 1] as const;

const actives = ["Vitamin C", "Niacinamide", "Hyaluronic Acid", "24KT Gold", "Retinol", "Glutathione", "Redensyl", "Aloe Vera", "Kojic Acid"];

export function Hero() {
  // Wait for the intro curtain on first visit; animate almost immediately afterwards.
  const [b] = useState(() => {
    try {
      return sessionStorage.getItem("dq-intro") ? 0 : 1.3;
    } catch {
      return 0;
    }
  });
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 15 });
  const sy = useSpring(my, { stiffness: 60, damping: 15 });
  const backX = useTransform(sx, (v) => v * -18);
  const backY = useTransform(sy, (v) => v * -18);
  const frontX = useTransform(sx, (v) => v * 26);
  const frontY = useTransform(sy, (v) => v * 26);
  const glowX = useTransform(sx, (v) => `${50 + v * 30}%`);
  const glowY = useTransform(sy, (v) => `${50 + v * 30}%`);

  return (
    <section className="px-3 pb-10 pt-4 sm:px-5 sm:pt-6 lg:pb-14">
      <div
        className="relative mx-auto max-w-[1600px] overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-[#fff4e8] via-white to-[#e8fbfd] shadow-[0_30px_80px_-40px_rgba(17,17,17,0.25)] sm:rounded-[2.75rem]"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
      >
        {/* backdrop: dotted grid, ambient blobs, cursor-following glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(17,17,17,0.18)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          <div className="absolute -left-32 -top-20 size-[420px] rounded-full bg-sun/25 blur-[110px]" />
          <div className="absolute -bottom-24 -right-24 size-[480px] rounded-full bg-aqua/30 blur-[120px]" />
          <div className="absolute left-1/2 top-1/4 size-[260px] rounded-full bg-lemon/30 blur-[100px]" />
          <motion.div
            style={{ left: glowX, top: glowY }}
            className="absolute size-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 blur-[90px]"
          />
        </div>

        <div className="relative grid items-center gap-12 px-6 pb-10 pt-12 sm:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:px-16 lg:pb-14 lg:pt-16 xl:px-20">
          <div className="relative z-10">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: b + 0.2, ease }}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 py-1.5 pl-1.5 pr-4 text-xs font-medium shadow-sm backdrop-blur"
            >
              <span className="grid size-6 place-items-center rounded-full bg-brand text-white">
                <Sparkles className="size-3.5" />
              </span>
              Premium 3X skincare & hair care serums
            </motion.p>

            <h1 className="font-display text-[clamp(2.7rem,5.6vw,5.4rem)] leading-[0.98] tracking-tight">
              {["Science of", "skin. Sum of"].map((line, i) => (
                <span key={line} className="block overflow-hidden pb-1">
                  <motion.span
                    className="block"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 1.1, delay: b + 0.25 + i * 0.12, ease }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
              <span className="block overflow-hidden pb-3">
                <motion.span
                  className="relative inline-block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1.1, delay: b + 0.5, ease }}
                >
                  <span className="text-brand animate-gradient italic">beauty.</span>
                  {/* hand-drawn underline */}
                  <svg aria-hidden viewBox="0 0 300 20" className="absolute -bottom-1 left-0 h-3 w-full" preserveAspectRatio="none">
                    <motion.path
                      d="M4 14 C 80 4, 200 4, 296 12"
                      fill="none"
                      stroke="url(#dq-underline)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2, delay: b + 1.1, ease }}
                    />
                    <defs>
                      <linearGradient id="dq-underline" x1="0" x2="1">
                        <stop offset="0" stopColor="#ff7a00" />
                        <stop offset="0.5" stopColor="#ffb300" />
                        <stop offset="1" stopColor="#19d3f3" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.span>
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: b + 0.7, ease }}
              className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft"
            >
              Every Dermisque serum pairs three powerful actives — a triple-action formula for glowing,
              healthy, younger-looking skin and fuller hair.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: b + 0.85, ease }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <ButtonLink href="/shop" size="lg">
                Shop all serums
                <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </ButtonLink>
              <ButtonLink href="/consultation" size="lg" variant="outline" className="bg-white/70 backdrop-blur">
                Free skin consultation
              </ButtonLink>
            </motion.div>

            <motion.dl
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: b + 1.1, ease }}
              className="mt-10 inline-grid grid-cols-3 divide-x divide-line rounded-2xl border border-white bg-white/60 py-4 shadow-sm backdrop-blur"
            >
              {[
                ["12", "Targeted serums"],
                ["3X", "Actives per formula"],
                ["100%", "Cruelty-free"],
              ].map(([n, l]) => (
                <div key={l} className="px-5 sm:px-7">
                  <dt className="font-display text-3xl">{n}</dt>
                  <dd className="mt-1 text-xs text-mute">{l}</dd>
                </div>
              ))}
            </motion.dl>
          </div>

          {/* product composition */}
          <div className="relative mx-auto aspect-square w-full max-w-[540px]">
            <div aria-hidden className="absolute inset-[4%] rounded-full border border-dashed border-ink/10 animate-spin-slow" />
            <motion.div
              aria-hidden
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.4, delay: b + 0.1, ease }}
              className="absolute inset-[14%] rounded-full bg-brand opacity-90 shadow-[0_40px_120px_-30px_rgba(255,122,0,0.6)]"
            />

            {/* rotating brand seal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: b + 1.0, ease }}
              className="absolute right-[2%] top-[2%] z-20 grid size-24 place-items-center rounded-full bg-ink text-white shadow-xl sm:size-28"
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 animate-spin-slow">
                <defs>
                  <path id="dq-seal" d="M50 50 m-37 0 a37 37 0 1 1 74 0 a37 37 0 1 1 -74 0" />
                </defs>
                <text className="fill-white text-[8px] font-medium uppercase" textLength="230" lengthAdjust="spacing">
                  <textPath href="#dq-seal" textLength="230" lengthAdjust="spacing">Sum of beauty • Science of skin •</textPath>
                </text>
              </svg>
              <span className="text-brand font-display text-2xl font-semibold">3X</span>
            </motion.div>

            <motion.div style={{ x: backX, y: backY }} className="absolute left-[2%] top-[8%] w-[42%]">
              <motion.div
                initial={{ opacity: 0, y: 60, rotate: -12 }}
                animate={{ opacity: 1, y: 0, rotate: -8 }}
                transition={{ duration: 1.2, delay: b + 0.4, ease }}
                className="animate-float overflow-hidden rounded-[2rem] border-4 border-white shadow-2xl transition-transform duration-500 [animation-delay:-2s] hover:scale-105"
              >
                <Image src="/products/vitamin-c.webp" alt="3X Vitamin C serum" width={400} height={400} preload />
              </motion.div>
            </motion.div>
            <motion.div style={{ x: backX, y: backY }} className="absolute bottom-[6%] right-[0%] w-[40%]">
              <motion.div
                initial={{ opacity: 0, y: 60, rotate: 12 }}
                animate={{ opacity: 1, y: 0, rotate: 7 }}
                transition={{ duration: 1.2, delay: b + 0.55, ease }}
                className="animate-float overflow-hidden rounded-[2rem] border-4 border-white shadow-2xl transition-transform duration-500 [animation-delay:-4s] hover:scale-105"
              >
                <Image src="/products/hair-growth.webp" alt="3X Hair Growth serum" width={400} height={400} preload />
              </motion.div>
            </motion.div>
            <motion.div style={{ x: frontX, y: frontY }} className="absolute left-1/2 top-1/2 z-10 w-[50%] -translate-x-1/2 -translate-y-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: b + 0.3, ease }}
                className="animate-float overflow-hidden rounded-[2.4rem] border-[6px] border-white shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)]"
              >
                <Image src="/products/gold-serum.jpg" alt="24 KT Gold serum" width={520} height={520} preload />
              </motion.div>
            </motion.div>

            {/* floating chips */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: b + 1.15, duration: 0.8, ease }}
              className="absolute bottom-[12%] left-[0%] z-20 rounded-2xl bg-white/90 px-4 py-3 shadow-xl backdrop-blur"
            >
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-mute">New customers</p>
              <p className="font-display text-xl">
                30% off · <span className="text-brand">NEW30</span>
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: b + 1.3, duration: 0.8, ease }}
              className="absolute right-[-2%] top-[46%] z-20 hidden items-center gap-2 rounded-full bg-white/90 py-2 pl-2 pr-4 text-xs font-medium shadow-xl backdrop-blur sm:flex"
            >
              <span className="flex -space-x-1.5">
                {[FlaskConical, Droplets, Leaf].map((Icon, i) => (
                  <span key={i} className="grid size-7 place-items-center rounded-full border-2 border-white bg-cream">
                    <Icon className="size-3.5 text-sun" />
                  </span>
                ))}
              </span>
              Triple-action actives
            </motion.div>
          </div>
        </div>

        {/* actives ticker */}
        <div className="relative border-t border-ink/5 bg-white/50 py-4 backdrop-blur [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
            {[...actives, ...actives].map((a, i) => (
              <span key={i} className="flex items-center gap-10 font-display text-lg text-ink-soft">
                {a}
                <Star className="size-3 fill-sun text-sun" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
