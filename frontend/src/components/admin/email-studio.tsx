"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Monitor,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { sendTestEmail } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

export type EmailOverview = {
  configured: boolean;
  enabled: boolean;
  sender: string;
  adminRecipient: string;
  reminderHours: number[];
  counts: Record<string, number>;
  templates: { key: string; name: string; audience: "Customer" | "Admin" }[];
  log: {
    id: string;
    to: string;
    subject: string;
    template: string;
    status: "QUEUED" | "SENT" | "FAILED" | "SKIPPED";
    error: string | null;
    createdAt: string;
    sentAt: string | null;
  }[];
};

const statusTone = {
  SENT: { cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  FAILED: { cls: "bg-red-100 text-red-700", icon: XCircle },
  SKIPPED: { cls: "bg-zinc-100 text-zinc-600", icon: AlertTriangle },
  QUEUED: { cls: "bg-amber-100 text-amber-800", icon: Clock },
} as const;

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function EmailStudio({ data }: { data: EmailOverview }) {
  const router = useRouter();
  const [active, setActive] = useState(data.templates[0]?.key ?? "");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [to, setTo] = useState(data.adminRecipient);
  const [loaded, setLoaded] = useState(false);
  const [sending, startSend] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const [tab, setTab] = useState<"templates" | "log">("templates");
  const frame = useRef<HTMLIFrameElement>(null);

  // The iframe may finish loading before hydration attaches onLoad — check its state directly.
  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (doc?.readyState === "complete" && doc.URL !== "about:blank") setLoaded(true);
  }, [active, tab]);

  const current = data.templates.find((t) => t.key === active);
  const live = data.configured && data.enabled;
  const stats = [
    {
      label: "Mail server",
      value: live ? "Connected" : data.configured ? "Paused" : "Not set up",
      sub: data.sender,
      icon: ShieldCheck,
      tone: live ? "text-emerald-600" : "text-amber-600",
    },
    { label: "Delivered", value: data.counts.SENT ?? 0, sub: "emails sent", icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Failed", value: data.counts.FAILED ?? 0, sub: "delivery errors", icon: XCircle, tone: "text-red-600" },
    {
      label: "Cart reminders",
      value: data.reminderHours.length ? data.reminderHours.map((h) => `${h}h`).join(" · ") : "Off",
      sub: "after a bag is left",
      icon: Clock,
      tone: "text-sun",
    },
  ];

  const sendTest = () =>
    startSend(async () => {
      const res = await sendTestEmail(active, to);
      if (res.ok) {
        toast.success(res.data.status === "SENT" ? `Test sent to ${to}` : `Logged (${res.data.status}) — ${res.data.error ?? ""}`);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon, tone }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-3xl bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-mute">{label}</p>
              <Icon className={cn("size-5", tone)} />
            </div>
            <p className="mt-3 font-display text-3xl">{value}</p>
            <p className="mt-1 truncate text-xs text-mute">{sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {(["templates", "log"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative rounded-full px-5 py-2 text-sm font-medium transition",
              tab === t ? "text-white" : "text-ink-soft hover:bg-white",
            )}
          >
            {tab === t && <motion.span layoutId="email-tab" className="absolute inset-0 rounded-full bg-ink" />}
            <span className="relative">{t === "log" ? `Activity log (${data.log.length})` : `Templates (${data.templates.length})`}</span>
          </button>
        ))}
        <button
          onClick={() => startRefresh(() => router.refresh())}
          className="ml-auto grid size-10 place-items-center rounded-full bg-white transition hover:bg-ink hover:text-white"
          aria-label="Refresh"
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
        </button>
      </div>

      {tab === "templates" ? (
        <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-5 rounded-3xl bg-white p-4 lg:sticky lg:top-24">
            {(["Customer", "Admin"] as const).map((aud) => (
              <div key={aud}>
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
                  {aud === "Customer" ? "Sent to customers" : `Sent to ${data.adminRecipient}`}
                </p>
                <ul className="space-y-1">
                  {data.templates
                    .filter((t) => t.audience === aud)
                    .map((t) => (
                      <li key={t.key}>
                        <button
                          onClick={() => {
                            if (t.key !== active) setLoaded(false);
                            setActive(t.key);
                          }}
                          className={cn(
                            "relative flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm transition",
                            active === t.key ? "bg-cream font-medium" : "text-ink-soft hover:bg-cream/60 hover:text-ink",
                          )}
                        >
                          {active === t.key && (
                            <motion.span layoutId="email-active" className="absolute inset-y-2 left-0 w-1 rounded-full bg-brand" />
                          )}
                          <Mail className={cn("size-4 shrink-0", active === t.key ? "text-sun" : "text-mute")} />
                          {t.name}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl bg-white">
            <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-mute">{current?.audience} email</p>
                <p className="truncate font-display text-xl">{current?.name}</p>
              </div>
              <div className="ml-auto flex rounded-full bg-cream p-1">
                {(
                  [
                    ["desktop", Monitor],
                    ["mobile", Smartphone],
                  ] as const
                ).map(([d, Icon]) => (
                  <button
                    key={d}
                    onClick={() => setDevice(d)}
                    aria-label={`${d} preview`}
                    className={cn("grid size-9 place-items-center rounded-full transition", device === d ? "bg-white shadow" : "text-mute hover:text-ink")}
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="relative grid place-items-center bg-[repeating-linear-gradient(45deg,#f4efe7_0_12px,#fbf9f5_12px_24px)] p-4 sm:p-8">
              <AnimatePresence>
                {!loaded && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 grid place-items-center bg-cream/70 backdrop-blur-sm"
                  >
                    <Loader2 className="size-6 animate-spin text-sun" />
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.iframe
                key={active}
                ref={frame}
                layout
                src={`/admin/emails/preview/${active}`}
                title={`${current?.name} preview`}
                onLoad={() => setLoaded(true)}
                className="h-[78vh] rounded-2xl bg-white shadow-xl"
                style={{ width: device === "mobile" ? 390 : "100%", maxWidth: 760 }}
                transition={{ type: "spring", stiffness: 200, damping: 26 }}
              />
            </div>

            <form
              className="flex flex-wrap items-center gap-3 border-t border-line p-4"
              onSubmit={(e) => {
                e.preventDefault();
                sendTest();
              }}
            >
              <p className="text-sm text-ink-soft">Send a test of this email to</p>
              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="input !w-auto min-w-0 flex-1 !rounded-full"
              />
              <button
                disabled={sending || !to}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-white transition hover:bg-ink/85 disabled:opacity-50"
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send test
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white">
          {data.log.length === 0 ? (
            <p className="p-16 text-center text-mute">No emails yet. Orders, sign-ups and form submissions will appear here.</p>
          ) : (
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-mute">
                <tr>
                  <th className="px-6 py-4 font-medium">Recipient</th>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.log.map((r) => {
                  const s = statusTone[r.status] ?? statusTone.QUEUED;
                  return (
                    <tr key={r.id} className="transition hover:bg-cream">
                      <td className="px-6 py-3">
                        <p className="font-medium">{r.to}</p>
                        <p className="text-xs text-mute">{r.template.replaceAll("_", " ")}</p>
                      </td>
                      <td className="max-w-[360px] px-6 py-3">
                        <p className="truncate">{r.subject}</p>
                        {r.error && (
                          <p className={cn("truncate text-xs", r.status === "FAILED" ? "text-red-600" : "text-mute")} title={r.error}>
                            {r.error}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", s.cls)}>
                          <s.icon className="size-3.5" /> {r.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-ink-soft">{when(r.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
