import { readdir } from "node:fs/promises";
import path from "node:path";
import { Clock, ListChecks, Sparkles } from "lucide-react";
import { SkinAssessment } from "@/components/store/skin-assessment";
import { Reveal } from "@/components/ui/reveal";
import { getProducts } from "@/lib/queries";
import { STEPS, type Answers } from "@/lib/skin-assessment";

export const metadata = {
  title: "Free Skin Assessment",
  description: "Answer four quick questions about your skin and get a personalised 3-step Dermisque serum routine.",
};

/** Option photos in /public/skin-assessment, named after the option value (e.g. oily.png). */
async function optionImages(): Promise<Record<string, string>> {
  const files = await readdir(path.join(process.cwd(), "public", "skin-assessment")).catch(() => [] as string[]);
  const out: Record<string, string> = {};
  for (const f of files) {
    const m = /^(.+)\.(png|jpe?g|webp|avif)$/i.exec(f);
    if (m) out[m[1].toLowerCase()] = `/skin-assessment/${f}`;
  }
  return out;
}

export default async function SkinAssessmentPage({ searchParams }: PageProps<"/skin-assessment">) {
  const [params, products, images] = await Promise.all([searchParams, getProducts().catch(() => []), optionImages()]);
  // answers in the URL (a shared or refreshed result) open straight on the results
  const initial: Partial<Answers> = {};
  for (const s of STEPS) {
    const v = params[s.key];
    if (typeof v === "string" && s.options.some((o) => o.value === v)) Object.assign(initial, { [s.key]: v });
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[linear-gradient(180deg,#fdeee2_0%,transparent_100%)]" />
      <div className="container-luxe relative py-14 sm:py-16">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Free skin assessment</p>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-6xl">Find your perfect routine</h1>
          <p className="mt-4 text-ink-soft">
            Answer four quick questions and we&apos;ll match you with the Dermisque serums your skin will love.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-ink-soft">
            <span className="inline-flex items-center gap-1.5"><Clock className="size-4 text-sun" /> Takes 1 minute</span>
            <span className="inline-flex items-center gap-1.5"><ListChecks className="size-4 text-sun" /> 4 simple questions</span>
            <span className="inline-flex items-center gap-1.5"><Sparkles className="size-4 text-sun" /> Personal 3-step routine</span>
          </div>
        </Reveal>
        <div className="mt-10">
          <SkinAssessment products={products} initial={initial} images={images} />
        </div>
      </div>
    </div>
  );
}
