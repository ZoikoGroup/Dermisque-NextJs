"use client";

import Image from "@/components/ui/product-image";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Product gallery with cursor-following zoom on hover. */
export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  return (
    <div className="flex flex-col-reverse gap-4 lg:sticky lg:top-24 lg:flex-row">
      {images.length > 1 && (
        <div className="flex gap-3 lg:flex-col">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={cn(
                "relative size-20 overflow-hidden rounded-2xl border-2 transition",
                i === active ? "border-ink" : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div
        className="relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-[2rem] bg-sand"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <Image
              src={images[active]}
              alt={name}
              fill
              preload
              sizes="(min-width:1024px) 50vw, 100vw"
              style={{ transformOrigin: origin }}
              className={cn(
                "object-cover transition-transform duration-500 ease-out",
                zoom && "scale-[1.8]",
              )}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
