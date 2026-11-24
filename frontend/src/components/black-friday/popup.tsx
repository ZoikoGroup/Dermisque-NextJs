"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { BF_IMG, BF_PATH, campaignStatus, saleDay, type BlackFriday } from "@/lib/black-friday";
import { CountdownBoxes } from "./countdown";
import { Seal } from "./parts";

type Campaign = Pick<BlackFriday, "live" | "startsAt" | "endsAt" | "singlePct" | "comboPct">;

// Closed during this page load only — a refresh (full reload) shows the popup again,
// while moving around the site and back to Home does not re-open it.
let dismissedThisLoad = false;

/** Black Friday announcement shown every time the home page is loaded or refreshed. */
export function BlackFridayPopup({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback(() => {
    setOpen(false);
    dismissedThisLoad = true;
  }, []);

  useEffect(() => {
    if (campaignStatus(campaign) === "ended") return;
    if (dismissedThisLoad) return;
    // wait for the intro splash on a first visit
    const t = setTimeout(() => setOpen(true), document.documentElement.classList.contains("dq-seen") ? 900 : 2600);
    return () => clearTimeout(t);
  }, [campaign]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bf-popup-title"
            className="relative grid w-full max-w-3xl overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#f7e9cd_0%,#ecd6ad_100%)] shadow-2xl md:grid-cols-[0.95fr_1.05fr]"
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full bg-white/85 text-ink shadow transition hover:rotate-90 hover:bg-white"
            >
              <X className="size-4" />
            </button>

            {/* photo */}
            <div className="group/photo relative h-52 overflow-hidden bg-[#6b4a3f] sm:h-64 md:h-auto md:min-h-[26rem]">
              <Image
                src={`${BF_IMG}/popup-model.png`}
                alt="Model presenting the Dermisque Black Friday edit"
                fill
                priority
                sizes="(min-width:768px) 380px, 100vw"
                className="object-cover object-[32%_22%] transition duration-[1.4s] ease-[var(--ease-luxe)] group-hover/photo:scale-105"
              />
              <Seal pct={campaign.singlePct} className="absolute bottom-4 right-4 w-24 text-[13px] md:w-28 md:text-sm" />
            </div>

            {/* copy */}
            <div className="relative p-6 sm:p-8">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-[#7a5a2b]">
                Dermisque · Black Friday
              </p>
              <h2 id="bf-popup-title" className="mt-3 text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl">
                {campaign.singlePct}% off every serum.{" "}
                <span className="bg-[linear-gradient(100deg,#8a3d05_0%,#c96a0d_55%,#f09a2a_100%)] bg-clip-text font-extrabold italic text-transparent">
                  {campaign.comboPct}% off combos.
                </span>
              </h2>
              <p className="mt-3 text-sm text-ink-soft">
                Black Friday to Cyber Monday, {saleDay(campaign.startsAt)} – {saleDay(campaign.endsAt)}. Giftable sets
                included.
              </p>

              <p className="mt-5 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-mute">
                {campaign.live ? "Sale ends in" : "Sale starts in"}
              </p>
              <CountdownBoxes startsAt={campaign.startsAt} endsAt={campaign.endsAt} variant="light" className="mt-2" />

              <Link
                href={BF_PATH}
                onClick={dismiss}
                className="sheen group mt-6 flex h-12 items-center justify-center gap-2 rounded-[3px] bg-ink text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white transition hover:shadow-xl"
              >
                {campaign.live ? "Shop Black Friday" : "Preview the edit"}
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <button
                type="button"
                onClick={dismiss}
                className="mt-3 w-full text-center text-xs text-mute underline-offset-4 hover:text-ink hover:underline"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
