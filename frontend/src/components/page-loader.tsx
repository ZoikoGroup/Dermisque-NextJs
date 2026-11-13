"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Branded intro splash: the Σ mark draws in with the logo gradient, then the
 * curtain lifts. Shown once per browser session so navigation stays instant.
 */
export function PageLoader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("dq-intro") === "1";
      sessionStorage.setItem("dq-intro", "1");
    } catch {}
    const t = setTimeout(() => setShow(false), seen ? 0 : 1700);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loader"
          className="dq-loader fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cream"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
        >
          <div className="relative grid size-28 place-items-center">
            <motion.span
              className="absolute inset-0 rounded-full bg-brand opacity-30 blur-2xl"
              animate={{ scale: [0.8, 1.15, 0.8], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
              <defs>
                <linearGradient id="dq-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff7a00" />
                  <stop offset="50%" stopColor="#ffe14d" />
                  <stop offset="100%" stopColor="#19d3f3" />
                </linearGradient>
              </defs>
              <motion.circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="url(#dq-ring)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.3, ease: "easeInOut" }}
              />
            </svg>
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image src="/sigma.png" alt="" width={64} height={64} preload />
            </motion.div>
          </div>
          <motion.p
            className="mt-6 font-display text-2xl tracking-[0.3em]"
            initial={{ opacity: 0, letterSpacing: "0.6em" }}
            animate={{ opacity: 1, letterSpacing: "0.3em" }}
            transition={{ delay: 0.3, duration: 0.9 }}
          >
            DERMISQUE
          </motion.p>
          <motion.p
            className="eyebrow mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Sum of Beauty
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
