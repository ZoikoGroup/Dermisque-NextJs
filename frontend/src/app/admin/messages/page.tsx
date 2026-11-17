import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { MessageActions } from "@/components/admin/inbox-actions";
import { StatusBadge } from "@/components/ui/misc";
import { api } from "@/lib/api";
import type { Message } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Messages" };

const tabs = [
  { v: undefined, l: "All" },
  { v: "CONSULTATION", l: "Consultations" },
  { v: "CONTACT", l: "Contact" },
];

export default async function Messages({ searchParams }: PageProps<"/admin/messages">) {
  const { type } = await searchParams;
  const t = typeof type === "string" ? type : undefined;
  const messages = await api<Message[]>("/api/admin/messages", { query: { type: t } });

  return (
    <div className="space-y-5">
      <div className="flex w-fit gap-1 rounded-full bg-white p-1">
        {tabs.map((x) => (
          <Link key={x.l} href={x.v ? `/admin/messages?type=${x.v}` : "/admin/messages"} className={cn("rounded-full px-4 py-2 text-xs font-medium", t === x.v ? "bg-ink text-white" : "hover:bg-cream")}>
            {x.l}
          </Link>
        ))}
      </div>
      {messages.length === 0 ? (
        <div className="rounded-3xl bg-white p-16 text-center text-mute">No messages yet.</div>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <article key={m.id} className={cn("rounded-3xl bg-white p-6", m.status === "NEW" && "ring-2 ring-aqua/40")}>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-medium">{m.name}</p>
                <span className="rounded-full bg-cream px-2.5 py-1 text-xs">{m.type === "CONSULTATION" ? "Consultation" : "Contact"}</span>
                <StatusBadge status={m.status} />
                <span className="ml-auto text-xs text-mute">{formatDate(m.createdAt)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-soft">
                <a href={`mailto:${m.email}`} className="flex items-center gap-1.5 hover:text-ink"><Mail className="size-3.5" /> {m.email}</a>
                {m.phone && <a href={`tel:${m.phone}`} className="flex items-center gap-1.5 hover:text-ink"><Phone className="size-3.5" /> {m.phone}</a>}
              </div>
              {(m.subject || m.skinType || m.concern) && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {m.subject && <span className="rounded-full border border-line px-2.5 py-1">Subject: {m.subject}</span>}
                  {m.skinType && <span className="rounded-full border border-line px-2.5 py-1">Skin: {m.skinType}</span>}
                  {m.concern && <span className="rounded-full border border-line px-2.5 py-1">Concern: {m.concern}</span>}
                </div>
              )}
              {m.details && <ConsultationDetails d={m.details} />}
              {m.message && (
                <div className="mt-4">
                  {m.details && <p className="text-xs font-medium uppercase tracking-wider text-mute">Reason for consultation</p>}
                  <p className="mt-1 whitespace-pre-line text-sm">{m.message}</p>
                </div>
              )}
              <div className="mt-5">
                <MessageActions id={m.id} status={m.status} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const day = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function ConsultationDetails({ d }: { d: NonNullable<Message["details"]> }) {
  const rows: [string, string | null][] = [
    ["Date of birth", day(d.dateOfBirth)],
    ["Gender", d.gender],
    ["Address", d.address],
    ["Preferred date", d.preferredDate && day(d.preferredDate)],
    ["Preferred time", d.preferredTime],
    ["Consulted before", d.previousConsultation],
    ["Recent treatments / surgery", d.recentTreatments],
    ["Current medications", d.medications],
  ];
  return (
    <dl className="mt-4 grid gap-x-6 gap-y-3 rounded-2xl bg-cream/60 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-mute">{k}</dt>
            <dd className="mt-0.5 whitespace-pre-line">{v}</dd>
          </div>
        ))}
    </dl>
  );
}
