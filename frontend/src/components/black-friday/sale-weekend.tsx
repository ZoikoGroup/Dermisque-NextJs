"use client";

import { motion } from "motion/react";
import { useNow } from "@/hooks/use-now";
import { type BlackFriday, saleDay } from "@/lib/black-friday";
import { cn } from "@/lib/utils";
import { Pill } from "./parts";

const DAY = 86_400_000;
const EST = -5 * 3_600_000; // the sale runs on US Eastern time (EST in November)
const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "America/New_York" });
const label = (from: number, to: number) => {
  const a = fmt.format(from).replace(",", "");
  return (to - from > DAY ? `${a} – ${fmt.format(to - DAY).replace(",", "")}` : a).toUpperCase();
};

export function SaleWeekend({ data }: { data: BlackFriday }) {
  const now = useNow();
  const midnight = (t: number) => Math.floor((t + EST) / DAY) * DAY - EST; // start of that day in EST
  const open = midnight(Date.parse(data.startsAt));
  const close = midnight(Date.parse(data.endsAt)) + DAY; // the sale runs to the end of its last day
  const friday = close - 4 * DAY; // Black Friday is the campaign's final Friday
  const totalDays = Math.round((close - open) / DAY);

  const days = [
    ...(friday > open
      ? [{ title: "Sale opens", text: `${data.singlePct}% off serums, ${data.comboPct}% off combos go live.`, from: open, to: friday }]
      : []),
    {
      title: "Black Friday",
      text: friday > open ? "Same Black Friday prices." : `${data.singlePct}% off serums, ${data.comboPct}% off combos go live.`,
      from: Math.max(friday, open),
      to: friday + DAY,
    },
    { title: "Weekend sale", text: "Same Black Friday prices.", from: friday + DAY, to: friday + 3 * DAY },
    { title: "Cyber Monday", text: "Last day. Sale ends 11:59 PM EST.", from: friday + 3 * DAY, to: close },
  ].map((d) => ({ ...d, start: d.from, label: label(d.from, d.to), today: now !== null && now >= d.from && now < d.to }));
  const anyToday = days.some((d) => d.today);

  return (
    <section className="px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl text-center">
        <Pill>The sale dates</Pill>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
          {totalDays} days. <span className="text-[#c9a227]">One big saving.</span>
        </h2>
        <p className="mt-3 text-sm text-mute">
          The same Black Friday prices run from {saleDay(data.startsAt)} through Cyber Monday, {saleDay(data.endsAt)}.
        </p>
      </div>

      <div className="relative mx-auto mt-12 max-w-6xl">
        <motion.div
          className="absolute left-0 right-0 top-[11px] hidden h-[3px] origin-left bg-ink md:block"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <ol className="relative grid gap-6 border-l-[3px] border-ink pl-6 md:grid-cols-4 md:border-l-0 md:pl-0">
          {days.map((d, i) => {
            const hot = d.today || (!anyToday && i === days.length - 1);
            return (
              <motion.li
                key={d.start}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
                className="relative md:pl-8"
              >
                <span
                  className={cn(
                    "absolute -left-[2.35rem] top-0 size-6 rounded-full border-[3px] md:left-8 md:-translate-x-1/2",
                    hot ? "border-white bg-[#e11d2e] shadow-[0_0_0_3px_#e11d2e]" : "border-ink bg-white",
                  )}
                >
                  {d.today && <span className="absolute inset-0 animate-ping rounded-full bg-[#e11d2e]/60" />}
                </span>
                <div className="md:pt-10">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-mute">
                    {d.label}
                    {d.today && <span className="ml-2 text-[#e11d2e]">· Today</span>}
                  </p>
                  <p className="mt-1 text-lg font-bold">{d.title}</p>
                  <p className="text-xs text-mute">{d.text}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
