"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { sendMessage } from "@/app/actions/store";
import { Button } from "@/components/ui/button";
import { concerns } from "@/lib/site";

export function MessageForm({ type }: { type: "CONTACT" | "CONSULTATION" }) {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);

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
          <p className="mt-5 font-display text-3xl">
            {type === "CONSULTATION" ? "Consultation requested" : "Message sent"}
          </p>
          <p className="mt-2 text-ink-soft">Our team will get back to you within 1–2 business days.</p>
          <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
            Send another
          </Button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          exit={{ opacity: 0 }}
          className="space-y-4 rounded-3xl bg-white p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const v = (k: string) => String(fd.get(k) ?? "");
            start(async () => {
              const res = await sendMessage({
                type,
                name: v("name"),
                email: v("email"),
                phone: v("phone"),
                subject: v("subject"),
                skinType: v("skinType"),
                concern: v("concern"),
                message: v("message"),
              });
              if (res.ok) setSent(true);
              else toast.error(res.error);
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">Full name</span>
              <input name="name" required minLength={2} className="input" autoComplete="name" />
            </label>
            <label>
              <span className="label">Email</span>
              <input name="email" type="email" required className="input" autoComplete="email" />
            </label>
            <label>
              <span className="label">Phone (optional)</span>
              <input name="phone" className="input" autoComplete="tel" />
            </label>
            {type === "CONTACT" ? (
              <label>
                <span className="label">Subject</span>
                <select name="subject" className="input">
                  <option>Order enquiry</option>
                  <option>Product question</option>
                  <option>Returns & replacement</option>
                  <option>Wholesale / partnership</option>
                  <option>Other</option>
                </select>
              </label>
            ) : (
              <label>
                <span className="label">Skin type</span>
                <select name="skinType" className="input">
                  <option>Normal</option>
                  <option>Dry</option>
                  <option>Oily</option>
                  <option>Combination</option>
                  <option>Sensitive</option>
                  <option>Not sure</option>
                </select>
              </label>
            )}
            {type === "CONSULTATION" && (
              <label className="sm:col-span-2">
                <span className="label">Main concern</span>
                <select name="concern" className="input">
                  {concerns.map((c) => (
                    <option key={c.slug}>{c.name}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="sm:col-span-2">
              <span className="label">
                {type === "CONSULTATION" ? "Tell us about your skin & current routine" : "Message"}
              </span>
              <textarea name="message" required minLength={10} className="input min-h-36" />
            </label>
          </div>
          <Button size="lg" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {type === "CONSULTATION" ? "Request free consultation" : "Send message"}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
