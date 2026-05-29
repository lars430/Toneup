"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickCheck({ locale }: { locale: string }) {
  const router = useRouter();
  const [dry, setDry] = useState<boolean | null>(null);
  const [sensitive, setSensitive] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasAnswer = dry !== null || sensitive !== null;

  async function save() {
    if (!hasAnswer) return;
    setSaving(true);

    const tags: string[] = [];
    const metrics: Record<string, number> = {};
    if (dry) { tags.push("dry_patches"); metrics.hydration = 1; }
    if (sensitive) { tags.push("redness"); metrics.sensitivity = 4; }

    let feel = "balanced";
    if (dry && sensitive) feel = "reactive";
    else if (dry) feel = "tight";
    else if (sensitive) feel = "reactive";

    await fetch("/api/skin-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feel, metrics, tags }),
    });

    setSaved(true);
    setSaving(false);
    setTimeout(() => router.refresh(), 600);
  }

  if (saved) {
    return (
      <p className="font-display italic text-sm text-bone/60 mt-3">
        Notert — oppdaterer…
      </p>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-bone/20">
      <p className="text-[10px] uppercase tracking-[0.28em] text-bone/40 mb-3">
        Kjapt notat
      </p>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm text-bone/80">
            Huden kjennes tørr?
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setDry(true)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border transition-colors ${
                dry === true
                  ? "border-bone bg-bone text-ink"
                  : "border-bone/30 text-bone/60 hover:border-bone/60"
              }`}
            >
              Ja
            </button>
            <button
              onClick={() => setDry(false)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border transition-colors ${
                dry === false
                  ? "border-bone/60 bg-bone/10 text-bone"
                  : "border-bone/30 text-bone/60 hover:border-bone/60"
              }`}
            >
              Nei
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-display text-sm text-bone/80">
            Sensitiv eller varm?
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setSensitive(true)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border transition-colors ${
                sensitive === true
                  ? "border-bone bg-bone text-ink"
                  : "border-bone/30 text-bone/60 hover:border-bone/60"
              }`}
            >
              Ja
            </button>
            <button
              onClick={() => setSensitive(false)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border transition-colors ${
                sensitive === false
                  ? "border-bone/60 bg-bone/10 text-bone"
                  : "border-bone/30 text-bone/60 hover:border-bone/60"
              }`}
            >
              Nei
            </button>
          </div>
        </div>
      </div>

      {hasAnswer && (
        <button
          onClick={save}
          disabled={saving}
          className="mt-3 text-[10px] uppercase tracking-[0.32em] text-bone/60 underline underline-offset-4 disabled:opacity-50 hover:text-bone/80 transition-colors"
        >
          {saving ? "Lagrer…" : "Lagre →"}
        </button>
      )}
    </div>
  );
}
