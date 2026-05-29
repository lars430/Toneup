"use client";

import { useState } from "react";

type Answer = "yes" | "no" | null;

export default function AnalysisPrecision() {
  const [dry, setDry] = useState<Answer>(null);
  const [sensitive, setSensitive] = useState<Answer>(null);
  const [actives, setActives] = useState<Answer>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const answered = dry !== null || sensitive !== null || actives !== null;

  async function save() {
    if (!answered) return;
    setSaving(true);

    const tags: string[] = [];
    const metrics: Record<string, number> = {};

    if (dry === "yes") {
      tags.push("dry_patches");
      metrics.hydration = 1;
    }
    if (sensitive === "yes") {
      tags.push("redness");
      metrics.sensitivity = 4;
    }

    let feel = "balanced";
    if (dry === "yes" && sensitive === "yes") feel = "reactive";
    else if (dry === "yes") feel = "tight";
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
          Presisert
        </div>
        <p className="font-display italic text-sm text-soft-ink leading-relaxed">
          Notert. Anbefalingene er oppdatert basert på svarene dine.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-8 border border-stone/40 px-5 py-5">
      <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">
        Presiser analysen
      </div>

      <div className="space-y-4 mb-5">
        <QuestionRow
          label="Føles huden tørr i dag?"
          value={dry}
          onChange={setDry}
        />
        <QuestionRow
          label="Sensitiv eller varm akkurat nå?"
          value={sensitive}
          onChange={setSensitive}
        />
        <QuestionRow
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
          {saving ? "Lagrer…" : "Lagre svar"}
        </button>
      )}
    </section>
  );
}

function QuestionRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Answer;
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
