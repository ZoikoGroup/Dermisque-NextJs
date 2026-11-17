import { ClipboardList, MessageCircle, Sparkles } from "lucide-react";
import { ConsultationForm } from "@/components/store/consultation-form";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";

export const metadata = { title: "Free Consultation & Skin Assessment" };

export default function ConsultationPage() {
  return (
    <div className="container-luxe py-16">
      <Reveal>
        <div className="max-w-3xl">
          <p className="eyebrow">Free consultation</p>
          <h1 className="mt-3 font-display text-5xl leading-tight sm:text-6xl">
            Your skin, <span className="text-brand italic">personally</span> understood.
          </h1>
          <p className="mt-5 text-lg text-ink-soft">
            Tell us about your skin and goals. Our experts will recommend a Dermisque routine tailored
            to you — completely free.
          </p>
        </div>
      </Reveal>

      <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          { icon: ClipboardList, t: "1. Share your skin story", d: "Your skin type, concerns and current routine." },
          { icon: MessageCircle, t: "2. Expert review", d: "Our team reviews it and gets in touch within 1–2 days." },
          { icon: Sparkles, t: "3. Your routine", d: "A personalised serum plan with how and when to use each." },
        ].map(({ icon: Icon, t, d }) => (
          <StaggerItem key={t}>
            <div className="ring-brand h-full rounded-3xl bg-white p-6">
              <Icon className="size-6 text-sun" />
              <p className="mt-4 font-display text-xl">{t}</p>
              <p className="mt-1 text-sm text-ink-soft">{d}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <div id="assessment" className="mt-12 scroll-mt-24">
        <Reveal>
          <h2 className="mb-6 font-display text-3xl">Book your free consultation</h2>
          <ConsultationForm />
        </Reveal>
      </div>
    </div>
  );
}
