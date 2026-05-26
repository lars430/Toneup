"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SKIN_TYPES = [
  { key: "dry", label: "Tørr" },
  { key: "oily", label: "Fet" },
  { key: "combination", label: "Kombinert" },
  { key: "normal", label: "Normal" },
  { key: "sensitive", label: "Sensitiv" },
  { key: "unknown", label: "Vet ikke" },
];

const SKIN_GOALS = [
  { key: "less_dryness", label: "Mindre tørrhet" },
  { key: "glow", label: "Glød" },
  { key: "less_acne", label: "Mindre akne" },
  { key: "even_tone", label: "Jevnere hudtone" },
  { key: "less_sensitivity", label: "Mindre sensitivitet" },
  { key: "anti_aging", label: "Forebygge aldring" },
  { key: "pore_minimizing", label: "Mindre porer" },
];

const HELP_WITH = [
  { key: "skincare", label: "Hudpleie" },
  { key: "foundation", label: "Foundation" },
  { key: "concealer", label: "Concealer" },
  { key: "blush", label: "Blush" },
  { key: "contour", label: "Contour" },
  { key: "lip", label: "Lepper" },
  { key: "eye", label: "Øyne" },
];

const LIFE_PHASES = [
  { key: "none", label: "Ingen" },
  { key: "menstrual_cycle", label: "Syklussporing" },
  { key: "pregnancy", label: "Gravid" },
  { key: "breastfeeding", label: "Ammer" },
  { key: "menopause", label: "Overgangsalder" },
];

const BUDGETS = [
  { key: "budget", label: "Rimelig" },
  { key: "mid", label: "Mellompris" },
  { key: "premium", label: "Premium" },
  { key: "luxury", label: "Luksus" },
];

export default function ProfileForm({
  locale,
  profile,
}: {
  locale: string;
  profile: any;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [skinType, setSkinType] = useState<string>(profile?.skin_type ?? "unknown");
  const [skinGoals, setSkinGoals] = useState<string[]>(profile?.skin_goals ?? []);
  const [helpWith, setHelpWith] = useState<string[]>(profile?.help_with ?? []);
  const [lifePhase, setLifePhase] = useState<string>(profile?.life_phase ?? "none");
  const [budget, setBudget] = useState<string>(profile?.preferences?.budget ?? "mid");
  const [fragranceFree, setFragranceFree] = useState<boolean>(profile?.preferences?.fragrance_free ?? false);
  const [vegan, setVegan] = useState<boolean>(profile?.preferences?.vegan ?? false);

  function toggleGoal(key: string) {
    setSkinGoals((prev) =>
      prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]
    );
  }

  function toggleHelpWith(key: string) {
    setHelpWith((prev) =>
      prev.includes(key) ? prev.filter((h) => h !== key) : [...prev, key]
    );
  }

  async function save() {
    setSaving(true);
    await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skin_type: skinType,
        skin_goals: skinGoals,
        help_with: helpWith,
        life_phase: lifePhase,
        preferences: { budget, fragrance_free: fragranceFree, vegan },
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      router.push(`/${locale}/me`);
      router.refresh();
    }, 800);
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-10">
      <header className="flex items-center gap-4 mb-9">
        <Link href={`/${locale}/me`} className="text-[10px] uppercase tracking-[0.32em] text-soft-ink">←</Link>
        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-1">Innstillinger</div>
          <h1 className="font-display text-3xl leading-tight tracking-wide2">Profil og preferanser</h1>
        </div>
      </header>

      {/* Skin type */}
      <section className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">Hudtype</div>
        <div className="grid grid-cols-3 gap-2">
          {SKIN_TYPES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSkinType(key)}
              className={`py-3 px-2 text-[11px] uppercase tracking-[0.24em] border transition-colors ${
                skinType === key
                  ? "border-ink bg-ink text-bone"
                  : "border-stone/40 text-soft-ink hover:border-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Skin goals */}
      <section className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">Hudmål</div>
        <div className="flex flex-wrap gap-2">
          {SKIN_GOALS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleGoal(key)}
              className={`px-4 py-2 text-[11px] uppercase tracking-[0.24em] border transition-colors ${
                skinGoals.includes(key)
                  ? "border-ink bg-ink text-bone"
                  : "border-stone/40 text-soft-ink hover:border-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Help with */}
      <section className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">Hva vil du ha hjelp med?</div>
        <div className="flex flex-wrap gap-2">
          {HELP_WITH.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleHelpWith(key)}
              className={`px-4 py-2 text-[11px] uppercase tracking-[0.24em] border transition-colors ${
                helpWith.includes(key)
                  ? "border-ink bg-ink text-bone"
                  : "border-stone/40 text-soft-ink hover:border-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Budget */}
      <section className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">Budsjett</div>
        <div className="grid grid-cols-4 gap-2">
          {BUDGETS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setBudget(key)}
              className={`py-3 text-[10px] uppercase tracking-[0.2em] border transition-colors ${
                budget === key
                  ? "border-ink bg-ink text-bone"
                  : "border-stone/40 text-soft-ink hover:border-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Preferences */}
      <section className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">Preferanser</div>
        <div className="space-y-3">
          <button
            onClick={() => setFragranceFree((v) => !v)}
            className={`w-full flex justify-between items-center px-5 py-4 border transition-colors ${
              fragranceFree ? "border-ink bg-ink text-bone" : "border-stone/40"
            }`}
          >
            <span className="font-display text-base">Parfymefritt</span>
            <span className="text-[10px] uppercase tracking-[0.24em]">{fragranceFree ? "Ja" : "Nei"}</span>
          </button>
          <button
            onClick={() => setVegan((v) => !v)}
            className={`w-full flex justify-between items-center px-5 py-4 border transition-colors ${
              vegan ? "border-ink bg-ink text-bone" : "border-stone/40"
            }`}
          >
            <span className="font-display text-base">Vegansk</span>
            <span className="text-[10px] uppercase tracking-[0.24em]">{vegan ? "Ja" : "Nei"}</span>
          </button>
        </div>
      </section>

      {/* Life phase */}
      <section className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">Livsfase (valgfritt)</div>
        <div className="space-y-2">
          {LIFE_PHASES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setLifePhase(key)}
              className={`w-full text-left px-5 py-4 border transition-colors font-display ${
                lifePhase === key
                  ? "border-ink bg-ink text-bone"
                  : "border-stone/40 text-soft-ink hover:border-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving || saved}
        className="w-full bg-ink text-bone py-5 text-[11px] uppercase tracking-[0.32em] disabled:opacity-50 mb-10"
      >
        {saved ? "Lagret" : saving ? "Lagrer…" : "Lagre profil"}
      </button>
    </div>
  );
}
