"use client";

import { useState } from "react";

type HydrationLevel = 1 | 2 | 3 | 4 | 5 | null;
type YesNo = "yes" | "no" | null;

const HYDRATION_OPTIONS: Array<{ value: HydrationLevel; label: string }> = [
  { value: 1, label: "Veldig tørr" },
  { value: 2, label: "Tørr" },
  { value: 3, label: "Normal" },
  { value: 4, label: "Fuktig" },
  { value: 5, label: "Veldig fuktig" },
];

export default function AnalysisPrecision() {
  const [hydration, setHydration] = useState<HydrationLevel>(null);
  const [sensitive, setSensitive] = useState<YesNo>(null);
  const [actives, setActives] = useState<YesNo>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const answered = hydration !== null || sensitive !== null || actives !== null;

  async function save() {
    if (!answered) return;
    setSaving(true);

    const tags: string[] = [];
    const metrics: Record<string, number> = {};

    if (hydration !== null) {
      metrics.hydration = hydration;
      if (hydration <= 2) tags.push("dry_patches");
    }
    if (sensitive === "yes") {
      tags.push("redness");
      metrics.sensitivity = 4;
    }

    // Utled feel fra svarene
    let feel = "balanced";
    if (hydration !== null && hydration <= 2 && sensitive === "yes") feel = "reactive";
    else if (hydration !== null && hydration <= 2) feel = "tight";
    else if (sensitive === "yes") feel = "reactive";

    const freeText =
      actives === "yes" ? "Brukt aktive ingredienser" : undefined;

    await fetch("/api/skin-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feel, metrics, tags, freeText }),
    });

    setSaved(true);
    setSaving(false);
  }

  if (saved) {
    return (
      <section className="mb-8 bg-cream px-5 py-5">
        <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-2">
          Justert
        </div>
        <p className="font-display italic text-sm text-soft-ink leading-relaxed">
          Notert. Anbefalingene er oppdatert.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-8 border border-stone/40 px-5 py-5">
      <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-1">
        Juster
      </div>
      <p className="font-display italic text-xs text-soft-ink mb-5 leading-relaxed">
        Fukt er vanskelig å lese fra bilde — si fra selv.
      </p>

      {/* Fukt-nivå */}
      <div className="mb-5">
        <div className="font-display text-sm mb-3">Hvordan kjennes fuktnivået?</div>
        <div className="flex gap-1">
          {HYDRATION_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setHydration(hydration === value ? null : value)}
              className={`flex-1 py-3 border text-[9px] uppercase tracking-[0.15em] leading-tight transition-colors ${
                hydration === value
                  ? "border-ink bg-ink text-bone"
                  : "border-stone/40 text-soft-ink hover:border-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sensitivitet */}
      <div className="mb-5">
        <YesNoRow
          label="Sensitiv eller varm akkurat nå?"
          value={sensitive}
          onChange={setSensitive}
        />
      </div>

      {/* Aktive ingredienser */}
      <div className="mb-5">
        <YesNoRow
          label="Brukt aktive ingredienser nylig?"
          value={actives}
          onChange={setActives}
        />
      </div>

      {answered && (
        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-ink text-bone py-3 text-[11px] uppercase tracking-[0.32em] disabled:opacity-50 transition-opacity"
        >
          {saving ? "Lagrer…" : "Lagre"}
        </button>
      )}
    </section>
  );
}

function YesNoRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: YesNo;
  onChange: (v: "yes" | "no") => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-display text-sm leading-snug">{label}</span>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onChange("yes")}
          className={`px-4 py-2 border text-[10px] uppercase tracking-[0.24em] transition-colors ${
            value === "yes"
              ? "border-ink bg-ink text-bone"
              : "border-stone/40 text-soft-ink hover:border-ink"
          }`}
        >
          Ja
        </button>
        <button
          onClick={() => onChange("no")}
          className={`px-4 py-2 border text-[10px] uppercase tracking-[0.24em] transition-colors ${
            value === "no"
              ? "border-stone/60 bg-stone/20 text-ink"
              : "border-stone/40 text-soft-ink hover:border-stone/60"
          }`}
        >
          Nei
        </button>
      </div>
    </div>
  );
}
