/** Skin assessment quiz: questions and the rules that turn answers into a 3-step routine. */

export type Texture = "oily" | "dry" | "combination";
export type Sensitivity = "normal" | "sensitive";
export type Concern = "acne" | "open-pores" | "pigmentation" | "dark-circles" | "acne-marks" | "aging";
export type Age = "under-25" | "25-34" | "35-44" | "45-plus";

export type Answers = { texture: Texture; sensitivity: Sensitivity; concern: Concern; age: Age };
export type StepKey = keyof Answers;

export type Option<V extends string = string> = { value: V; label: string; hint: string };

export const STEPS: { key: StepKey; title: string; subtitle: string; options: Option[] }[] = [
  {
    key: "texture",
    title: "What is your skin texture?",
    subtitle: "This helps us know the moisture content in your skin.",
    options: [
      { value: "oily", label: "Oily", hint: "Shiny by midday, visible pores" },
      { value: "dry", label: "Dry", hint: "Feels tight, can flake" },
      { value: "combination", label: "Combination", hint: "Oily T-zone, drier cheeks" },
    ],
  },
  {
    key: "sensitivity",
    title: "What is your skin type?",
    subtitle: "This helps us choose the right ingredients for your skin.",
    options: [
      { value: "normal", label: "Normal", hint: "Rarely reacts to new products" },
      { value: "sensitive", label: "Sensitive", hint: "Redness, stinging or itching" },
    ],
  },
  {
    key: "concern",
    title: "Which of these describes your concern?",
    subtitle: "Select any one.",
    options: [
      { value: "acne", label: "Acne", hint: "Breakouts and blemishes" },
      { value: "open-pores", label: "Open Pores", hint: "Enlarged, visible pores" },
      { value: "pigmentation", label: "Pigmentation", hint: "Dark patches, uneven tone" },
      { value: "dark-circles", label: "Dark Circles", hint: "Tired, shadowed eyes" },
      { value: "acne-marks", label: "Acne Marks & Scars", hint: "Marks left after breakouts" },
      { value: "aging", label: "Aging", hint: "Fine lines, loss of firmness" },
    ],
  },
  {
    key: "age",
    title: "What is your age range?",
    subtitle: "Skin needs change over time, so this fine-tunes your routine.",
    options: [
      { value: "under-25", label: "Under 25", hint: "Prevent and protect" },
      { value: "25-34", label: "25 – 34", hint: "First fine lines" },
      { value: "35-44", label: "35 – 44", hint: "Firmness and renewal" },
      { value: "45-plus", label: "45+", hint: "Deep repair and lift" },
    ],
  },
];

export const label = (key: StepKey, value: string) =>
  STEPS.find((s) => s.key === key)?.options.find((o) => o.value === value)?.label ?? value;

export function isAnswers(a: Partial<Record<StepKey, string>>): a is Answers {
  return STEPS.every((s) => s.options.some((o) => o.value === a[s.key]));
}

// Product slugs in the catalogue
const P = {
  vitaminC: "vitamin-c-face-serum",
  brightening: "skin-brightening-face-serum",
  hydrating: "skin-hydrating-face-serum",
  underEye: "under-eye-serum",
  darkSpot: "dark-spot-corrector-face-serum",
  antiAging: "anti-aging-face-serum",
  gold: "24kt-gold-serum",
  exfoliating: "skin-exfoliating-face-serum",
  gluta: "gluta-glow-face-serum",
  aloe: "aloe-glow-face-serum",
} as const;

/** Treatment picks per concern, strongest first. */
const BY_CONCERN: Record<Concern, string[]> = {
  acne: [P.exfoliating, P.brightening, P.aloe],
  "open-pores": [P.brightening, P.exfoliating, P.gold],
  pigmentation: [P.darkSpot, P.gluta, P.vitaminC],
  "dark-circles": [P.underEye, P.vitaminC, P.hydrating],
  "acne-marks": [P.darkSpot, P.exfoliating, P.aloe],
  aging: [P.antiAging, P.gold, P.vitaminC],
};

/** Why a serum suits this concern — shown under each pick. */
const WHY: Record<string, string> = {
  [P.exfoliating]: "AHA–BHA gently clears congested pores and smooths uneven texture.",
  [P.brightening]: "Niacinamide 10% balances oil, refines pores and evens tone.",
  [P.aloe]: "Aloe calms redness and repairs the barrier without clogging pores.",
  [P.gold]: "24 KT Gold with niacinamide and hyaluronic acid for a firm, refined glow.",
  [P.darkSpot]: "Alpha arbutin, niacinamide and kojic acid fade marks and dark patches.",
  [P.gluta]: "Liposomal glutathione brightens dullness for a luminous, even tone.",
  [P.vitaminC]: "Antioxidant vitamin C revives radiance and defends against daily stress.",
  [P.underEye]: "A cooling roller that targets puffiness and shadows under the eyes.",
  [P.hydrating]: "Hyaluronic acid with silanol floods skin with lasting, weightless moisture.",
  [P.antiAging]: "Retinol with witch hazel and vitamin E smooths lines and renews skin.",
};

export type Pick = { slug: string; role: "Treat" | "Boost" | "Balance" | "Hydrate" | "Soothe"; why: string };

export type Result = { picks: Pick[]; tips: string[]; headline: string };

/** Builds a 3-serum routine from the answers. Pure and deterministic, so results can be shared by URL. */
export function recommend(a: Answers): Result {
  const sensitive = a.sensitivity === "sensitive";
  const mature = a.age === "35-44" || a.age === "45-plus";

  let pool = [...BY_CONCERN[a.concern]];
  // sensitive skin: swap strong acids for soothing aloe
  if (sensitive) pool = pool.map((s) => (s === P.exfoliating ? P.aloe : s));
  // mature skin with a non-aging concern: make room for a firming serum
  if (mature && a.concern !== "aging") pool.splice(2, 0, a.age === "45-plus" && !sensitive ? P.antiAging : P.gold);

  // the third step always looks after moisture, chosen by texture
  const finisher = sensitive ? P.aloe : a.texture === "oily" ? P.brightening : P.hydrating;
  const treat = [...new Set(pool.filter((s) => s !== finisher))];
  // top up to two treatments if the finisher swallowed one (e.g. aloe for sensitive acne-prone skin)
  for (const s of [P.vitaminC, P.hydrating, P.gold]) if (treat.length < 2 && s !== finisher && !treat.includes(s)) treat.push(s);
  const slugs = [...treat.slice(0, 2), finisher];

  const finisherRole: Pick["role"] = sensitive ? "Soothe" : a.texture === "oily" ? "Balance" : "Hydrate";
  const picks: Pick[] = slugs.slice(0, 3).map((slug, i) => ({
    slug,
    role: i === 0 ? "Treat" : i === 1 ? "Boost" : finisherRole,
    why: WHY[slug] ?? "",
  }));

  const tips = [
    sensitive
      ? "Patch-test each new serum on your inner arm for 24 hours, then introduce one at a time."
      : "Introduce one new serum every few days so you can see what each one does.",
    a.texture === "oily"
      ? "Use a gentle gel cleanser twice a day — over-washing makes skin produce more oil."
      : a.texture === "dry"
        ? "Apply serums to slightly damp skin and seal them in with a rich moisturiser."
        : "Treat your T-zone and cheeks differently: lighter layers where you're oily, richer where you're dry.",
    slugs.includes(P.antiAging) || slugs.includes(P.exfoliating)
      ? "Use retinol and acids at night only, start 2–3 times a week, and wear SPF every morning."
      : "Finish every morning with a broad-spectrum SPF 30+ to protect your results.",
  ];

  const headline = `${label("texture", a.texture)}, ${label("sensitivity", a.sensitivity).toLowerCase()} skin focused on ${label("concern", a.concern).toLowerCase()}`;
  return { picks, tips, headline };
}
