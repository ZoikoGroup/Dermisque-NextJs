"use client";

import { useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { sendMessage, type ConsultationDetails } from "@/app/actions/store";
import { Button } from "@/components/ui/button";

const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"] as const;
const YES_NO = ["Yes", "No"] as const;

/** Today's date as YYYY-MM-DD in the visitor's own timezone ("" while rendering on the server). */
const noop = () => () => {};
function useToday() {
  return useSyncExternalStore(
    noop,
    () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10),
    () => "",
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: ReactNode }) {
  return (
    <label className={className}>
      <span className="label">
        {label}
        {required && <span className="ml-0.5 text-[#e11d2e]">*</span>}
      </span>
      {children}
    </label>
  );
}

function Choice({ name, placeholder, options }: { name: string; placeholder: string; options: readonly string[] }) {
  return (
    <select name={name} defaultValue="" className="input">
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <h3 className="pt-4 text-center font-display text-2xl sm:text-3xl">{children}</h3>;
}

/** Free consultation request: personal, appointment and health details. */
export function ConsultationForm() {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const today = useToday();

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-white p-12 text-center"
        >
          <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.1 }}>
            <CheckCircle2 className="mx-auto size-14 text-teal" />
          </motion.div>
          <p className="mt-5 font-display text-3xl">Consultation requested</p>
          <p className="mt-2 text-ink-soft">
            Our skin expert will contact you within 24–48 hours to confirm your appointment.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
            Send another request
          </Button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          exit={{ opacity: 0 }}
          className="space-y-6 rounded-3xl bg-white p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const v = (k: string) => String(fd.get(k) ?? "").trim();
            const opt = (k: string) => v(k) || null;
            const details: ConsultationDetails = {
              dateOfBirth: v("dateOfBirth"),
              gender: opt("gender"),
              address: opt("address"),
              preferredDate: opt("preferredDate"),
              preferredTime: opt("preferredTime"),
              previousConsultation: opt("previousConsultation"),
              medications: opt("medications"),
              recentTreatments: opt("recentTreatments"),
              consentOnline: fd.get("consentOnline") === "on",
              infoAccurate: fd.get("infoAccurate") === "on",
            };
            start(async () => {
              const res = await sendMessage({
                type: "CONSULTATION",
                name: v("name"),
                email: v("email"),
                phone: v("phone"),
                message: v("message"),
                details,
              });
              if (res.ok) setSent(true);
              else toast.error(res.error);
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="First name" required>
              <input name="name" required minLength={2} maxLength={120} className="input" autoComplete="given-name" />
            </Field>
            <Field label="Date of birth" required>
              <input name="dateOfBirth" type="date" required min="1900-01-01" max={today || undefined} className="input" autoComplete="bday" />
            </Field>
            <Field label="Gender">
              <Choice name="gender" placeholder="Select gender" options={GENDERS} />
            </Field>
            <Field label="Email address" required>
              <input name="email" type="email" required className="input" autoComplete="email" />
            </Field>
            <Field label="Contact number" required>
              <input name="phone" type="tel" required maxLength={40} className="input" autoComplete="tel" />
            </Field>
            <Field label="Address">
              <input name="address" maxLength={300} className="input" autoComplete="street-address" />
            </Field>
          </div>

          <Heading>Appointment details</Heading>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferred date for appointment">
              <input name="preferredDate" type="date" min={today || undefined} className="input" />
            </Field>
            <Field label="Reason for consultation">
              <textarea
                name="message"
                maxLength={5000}
                rows={2}
                placeholder="Briefly describe your skin concerns or reasons for the consultation"
                className="input resize-y"
              />
            </Field>
            <Field label="Preferred time for appointment">
              <input name="preferredTime" type="time" className="input" />
            </Field>
            <Field label="Have you had a consultation with our skin expert before?">
              <Choice name="previousConsultation" placeholder="Yes or No" options={YES_NO} />
            </Field>
          </div>

          <Heading>Health information</Heading>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="List any current medications">
              <textarea
                name="medications"
                maxLength={1000}
                rows={3}
                placeholder="e.g. medicines, creams or supplements you use regularly"
                className="input resize-y"
              />
            </Field>
            <Field label="Have you undergone any recent skin treatments or surgeries?">
              <Choice name="recentTreatments" placeholder="Yes or No" options={YES_NO} />
            </Field>
          </div>

          <div className="space-y-3 pt-2 text-sm text-ink-soft">
            {[
              ["consentOnline", "I consent to an online consultation with the skin expert."],
              ["infoAccurate", "The information provided is accurate to the best of my knowledge."],
            ].map(([name, text]) => (
              <label key={name} className="flex cursor-pointer items-start gap-3">
                <input name={name} type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[#ffb300]" />
                {text}
              </label>
            ))}
          </div>

          <Button size="lg" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Submit
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
