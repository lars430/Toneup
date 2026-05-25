"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type {
  SkinType,
  GenderIdentity,
  LifePhase,
  PriceTier,
} from "@/types/domain";

/**
 * SHORTENED ONBOARDING — 4 steps instead of 8.
 *
 * Philosophy: ask only what we *need* to generate the first wow report.
 * Everything else (life phase, full preferences, age) is opt-in later in
 * "Min profil" once trust is established.
 *
 * The 4 steps:
 *   1. Skin type (or "not sure")
 *   2. Primary goal (single, with optional secondary)
 *   3. Gender + budget (combined, optional)
 *   4. Generate first palette → immediate aha
 */

type Step = "skin_type" | "goals" | "preferences" | "generating";

const STEPS: Step[] = ["skin_type", "goals", "preferences", "generating"];

interface OnboardingState {
  skinType?: SkinType;
  goals: string[];
  gender?: GenderIdentity;
  budget?: PriceTier;
  fragranceFree?: boolean;
  vegan?: boolean;
}

export default function OnboardingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<OnboardingState>({ goals: [] });
  const [submitting, setSubmitting] = useState(false);

  const step = STEPS[stepIndex];
  const total = STEPS.length;
  const next = () => setStepIndex((i) => Math.min(i + 1, total - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  async function complete() {
    setSubmitting(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skinType: state.skinType,
        goals: state.goals,
        gender: state.gender ?? "prefer_not_to_say",
        preferences: {
          budget: state.budget ?? "mid",
          fragranceFree: state.fragranceFree ?? false,
          vegan: state.vegan ?? false,
        },
        lifePhase: "none",
        locale,
      }),
    });
    if (res.ok) {
      router.push(`/${locale}/onboarding/palette`);
    } else {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col p-8 bg-bone">
      <header className="flex justify-between items-center mb-10">
        <button onClick={back} disabled={stepIndex === 0}
          className="text-[11px] uppercase tracking-[0.24em] text-soft-ink disabled:opacity-30">
          {t("common.back")}
        </button>
        <span className="text-[10px] uppercase tracking-[0.32em] text-mute">
          {stepIndex + 1} · {total}
        </span>
        <span className="w-12" />
      </header>

      <div className="h-px bg-stone/40 mb-12 relative">
        <div className="absolute top-0 left-0 h-px bg-ink transition-all duration-500"
          style={{ width: `${((stepIndex + 1) / total) * 100}%` }} />
      </div>

      <div className="flex-1 flex flex-col">
        {step === "skin_type" && <SkinTypeStep state={state} setState={setState} onNext={next} t={t} />}
        {step === "goals" && <GoalsStep state={state} setState={setState} onNext={next} t={t} />}
        {step === "preferences" && <PrefsStep state={state} setState={setState} onNext={next} t={t} />}
        {step === "generating" && <GeneratingStep onFinish={complete} t={t} submitting={submitting} />}
      </div>
    </main>
  );
}

function StepShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="font-display text-4xl leading-tight tracking-wide2 mb-3">{title}</h1>
        <p className="font-display italic text-soft-ink text-lg">{sub}</p>
      </div>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

function Choice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left px-5 py-4 border transition-colors font-display text-base mb-3 ${
        selected ? "border-ink bg-ink text-bone" : "border-stone/50 text-ink hover:border-ink"
      }`}>
      {label}
    </button>
  );
}

function MultiChoice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-3 border text-sm font-display transition-colors ${
        selected ? "border-ink bg-ink text-bone" : "border-stone/50 text-ink hover:border-ink"
      }`}>
      {label}
    </button>
  );
}

function SkinTypeStep({ state, setState, onNext, t }: any) {
  const options: SkinType[] = ["dry", "oily", "combination", "normal", "sensitive", "unknown"];
  return (
    <StepShell title={t("onboarding.skin_type_title")} sub={t("onboarding.skin_type_sub")}>
      <div>
        {options.map((s) => (
          <Choice key={s} label={t(`skin_type.${s}`)}
            selected={state.skinType === s}
            onClick={() => setState({ ...state, skinType: s })} />
        ))}
      </div>
      <button onClick={onNext} disabled={!state.skinType}
        className="btn-primary mt-auto disabled:opacity-40">
        {t("common.continue")}
      </button>
    </StepShell>
  );
}

function GoalsStep({ state, setState, onNext, t }: any) {
  const options = ["less_dryness", "glow", "less_acne", "even_tone", "less_sensitivity", "anti_aging", "pore_minimizing"];
  const toggle = (g: string) => {
    const has = state.goals.includes(g);
    setState({
      ...state,
      goals: has ? state.goals.filter((x: string) => x !== g) : [...state.goals, g].slice(0, 3),
    });
  };
  return (
    <StepShell title={t("onboarding.goals_title")} sub="Velg inntil 3.">
      <div className="grid grid-cols-2 gap-2">
        {options.map((g) => (
          <MultiChoice key={g} label={t(`goals.${g}`)}
            selected={state.goals.includes(g)} onClick={() => toggle(g)} />
        ))}
      </div>
      <button onClick={onNext} disabled={state.goals.length === 0}
        className="btn-primary mt-auto disabled:opacity-40">
        {t("common.continue")}
      </button>
    </StepShell>
  );
}

function PrefsStep({ state, setState, onNext, t }: any) {
  const tiers: PriceTier[] = ["budget", "mid", "premium", "luxury"];
  const genders: GenderIdentity[] = ["female", "male", "non_binary", "prefer_not_to_say"];
  return (
    <StepShell title="Litt om deg og dine valg" sub="Helt valgfritt.">
      <div className="editorial-eyebrow mb-3 mt-2">Hvordan identifiserer du deg?</div>
      <div className="grid grid-cols-2 gap-2 mb-7">
        {genders.map((g) => (
          <MultiChoice key={g} label={t(`gender.${g}`)}
            selected={state.gender === g}
            onClick={() => setState({ ...state, gender: g })} />
        ))}
      </div>

      <div className="editorial-eyebrow mb-3">{t("preferences.budget")}</div>
      <div className="grid grid-cols-2 gap-2 mb-7">
        {tiers.map((tier) => (
          <MultiChoice key={tier} label={t(`preferences.budget_${tier}`)}
            selected={state.budget === tier}
            onClick={() => setState({ ...state, budget: tier })} />
        ))}
      </div>

      <div className="editorial-eyebrow mb-3">Foretrekker</div>
      <div className="flex gap-2 mb-7">
        <button
          onClick={() => setState({ ...state, fragranceFree: !state.fragranceFree })}
          className={`flex-1 px-4 py-3 border text-sm font-display ${
            state.fragranceFree ? "border-ink bg-ink text-bone" : "border-stone/50"
          }`}>{t("preferences.fragrance_free")}</button>
        <button
          onClick={() => setState({ ...state, vegan: !state.vegan })}
          className={`flex-1 px-4 py-3 border text-sm font-display ${
            state.vegan ? "border-ink bg-ink text-bone" : "border-stone/50"
          }`}>{t("preferences.vegan")}</button>
      </div>

      <button onClick={onNext} className="btn-primary mt-auto">
        {t("common.continue")}
      </button>
    </StepShell>
  );
}

function GeneratingStep({ onFinish, submitting, t }: any) {
  return (
    <div className="flex flex-col items-center text-center justify-center flex-1 py-12">
      <div className="divider-line mb-8 mx-auto" />
      <h1 className="font-display text-5xl mb-4 tracking-wide2">
        {t("onboarding.complete_title")}
      </h1>
      <p className="font-display italic text-soft-ink text-lg max-w-xs mb-12">
        Vi kuraterer din første palett nå.
      </p>
      <button onClick={onFinish} disabled={submitting} className="btn-primary max-w-xs disabled:opacity-50">
        {submitting ? "Et øyeblikk…" : "Vis min palett"}
      </button>
      <p className="text-[10px] tracking-wider text-mute mt-10 max-w-xs leading-relaxed">
        {t("disclaimer.cosmetic_only")}
      </p>
    </div>
  );
}
