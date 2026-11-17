"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Loader2, Send, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { sendMessage } from "@/app/actions/store";
import { Button } from "@/components/ui/button";

/**
 * Contact page feedback form (the consultation page uses ConsultationForm).
 * `topic` tags the message, e.g. "Distributor enquiry" from the distributor card.
 */
export function MessageForm({ topic }: { topic?: string }) {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-white p-12 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]"
        >
          <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.1 }}>
            <CheckCircle2 className="mx-auto size-14 text-teal" />
          </motion.div>
          <p className="mt-5 font-display text-3xl">Message sent</p>
          <p className="mt-2 text-ink-soft">Thank you. Our team will get back to you within 1–2 business days.</p>
          <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
            Send another
          </Button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          exit={{ opacity: 0 }}
          className="space-y-4 rounded-3xl bg-white p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const v = (k: string) => String(fd.get(k) ?? "").trim();
            start(async () => {
              const res = await sendMessage({
                type: "CONTACT",
                name: [v("firstName"), v("lastName")].filter(Boolean).join(" "),
                email: v("email"),
                subject: topic ?? "Feedback",
                message: v("message"),
              });
              if (res.ok) setSent(true);
              else toast.error(res.error);
            });
          }}
        >
          {topic && (
            <p className="flex w-fit items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-xs font-medium">
              Topic: {topic}
              <Link href="/contact#feedback" scroll={false} aria-label="Clear topic" className="text-mute hover:text-ink">
                <X className="size-3.5" />
              </Link>
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">First name</span>
              <input name="firstName" required minLength={2} maxLength={60} className="input" autoComplete="given-name" />
            </label>
            <label>
              <span className="label">Last name</span>
              <input name="lastName" maxLength={60} className="input" autoComplete="family-name" />
            </label>
            <label className="sm:col-span-2">
              <span className="label">Email address</span>
              <input name="email" type="email" required className="input" autoComplete="email" />
            </label>
            <label className="sm:col-span-2">
              <span className="label">Message</span>
              <textarea
                name="message"
                required
                minLength={10}
                maxLength={5000}
                placeholder="Write your message or send feedback"
                className="input min-h-36 resize-y"
              />
            </label>
          </div>
          <Button size="lg" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send message
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
