"use client";

import { motion } from "motion/react";

const colors = ["#ff7a00", "#ffb300", "#ffe14d", "#c6ea5a", "#19d3f3", "#07a9cc"];

/** One-shot confetti burst in the logo palette. */
export function SuccessBurst() {
  const pieces = Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * Math.PI * 2;
    const dist = 140 + ((i * 37) % 120);
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 60,
      r: (i * 47) % 360,
      c: colors[i % colors.length],
      s: 6 + (i % 4) * 2,
    };
  });
  return (
    <div aria-hidden className="pointer-events-none fixed left-1/2 top-1/3 z-50">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute block rounded-sm"
          style={{ width: p.s, height: p.s * 1.6, background: p.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 260], opacity: [1, 1, 0], rotate: p.r * 3, scale: 1 }}
          transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
      ))}
    </div>
  );
}
