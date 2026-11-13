import { FreeShippingText } from "./currency-provider";

const messages = [
  "30% off your first order — use code NEW30",
  "Free shipping on orders over {amount}",
  "Delivery in 2–7 days",
  "Cruelty-free · ISO 9001:2015 · GMP certified",
  "25% off your second order — code DERMISQUE",
  "Free skin consultation with our experts",
];

export function Announcement() {
  const row = [...messages, ...messages];
  return (
    <div className="relative overflow-hidden bg-ink py-2.5 text-[0.72rem] font-medium uppercase tracking-[0.22em] text-white">
      <div className="flex w-max animate-marquee gap-12 hover:[animation-play-state:paused]">
        {row.map((m, i) => (
          <span key={i} className="flex items-center gap-12 whitespace-nowrap">
            {m.includes("{amount}") ? <FreeShippingText template={m} /> : m}
            <span className="text-brand text-base leading-none">Σ</span>
          </span>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-brand" />
    </div>
  );
}
