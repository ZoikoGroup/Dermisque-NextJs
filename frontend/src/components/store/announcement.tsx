const messages = [
  "30% off your first order · code NEW30",
  "Complimentary skin consultation",
  "Discover triple-action serums",
];

const Dot = () => <span className="size-1.5 shrink-0 rounded-full bg-[#d9b46a]" />;

export function Announcement() {
  return (
    <div className="relative overflow-hidden bg-[#0f3d35] py-2 text-[0.7rem] font-medium uppercase tracking-[0.04em] text-white sm:text-[0.76rem]">
      {/* desktop: three messages spread across the bar */}
      <div className="mx-auto w-full max-w-[112rem] px-4 sm:px-6 lg:px-10 2xl:px-[4.5rem] hidden items-center justify-between gap-6 lg:flex">
        {messages.map((m, i) => (
          <div key={m} className="contents">
            {i > 0 && <Dot />}
            <span className="whitespace-nowrap">{m}</span>
          </div>
        ))}
      </div>
      {/* smaller screens: a slow ticker */}
      <div className="flex w-max animate-marquee gap-10 lg:hidden">
        {[...messages, ...messages, ...messages, ...messages].map((m, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap">
            {m}
            <Dot />
          </span>
        ))}
      </div>
    </div>
  );
}
