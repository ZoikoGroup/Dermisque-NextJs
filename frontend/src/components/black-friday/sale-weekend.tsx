"use client";

import { motion } from "motion/react";
import { useNow } from "@/hooks/use-now";
import { type BlackFriday } from "@/lib/black-friday";
import { cn } from "@/lib/utils";
import { Pill } from "./parts";

const DAY = 86_400_000;
const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" });

export function SaleWeekend({ data }: { data: BlackFriday }) {
  const now = useNow();
  // the four official sale days run from the campaign's final Friday (end - 3 days)
  const end = Date.parse(data.endsAt);
  const friday = new Date(end - 3 * DAY);
  friday.setUTCHours(0, 0, 0, 0);
  const days = [
    { title: "Black Friday", text: `${data.singlePct}% off serums, ${data.comboPct}% off combos go live.` },
    { title: "Weekend sale", text: "Same Black Friday prices." },
    { title: "Weekend sale", text: "Same Black Friday prices." },
    { title: "Cyber Monday", text: "Last day. Sale ends 23:59." },
  ].map((d, i) => {
    const start = friday.getTime() + i * DAY;
    return { ...d, start, label: fmt.format(start).replace(",", "").toUpperCase(), today: now !== null && now >= start && now < start + DAY };
  });
  const anyToday = days.some((d) => d.today);

  return (
    <section className="px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl text-center">
        <Pill>The sale weekend</Pill>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
          Four days. <span className="text-[#c9a227]">One big saving.</span>
        </h2>
        <p className="mt-3 text-sm text-mute">The same Black Friday prices run from Friday through Cyber Monday.</p>
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
