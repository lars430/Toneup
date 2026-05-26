"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

type SkinFeel = "radiant" | "balanced" | "tired" | "tight" | "reactive" | "oily";

const FEELS: Array<{ key: SkinFeel; label: string; sub: string }> = [
  { key: "radiant",  label: "Strålende", sub: "Glød, livfull, balansert" },
  { key: "balanced", label: "Balansert",  sub: "Rolig, harmonisk" },
  { key: "tired",    label: "Trett",      sub: "Matt, livløs" },
  { key: "tight",    label: "Stram",      sub: "Tørr, ber om fukt" },
  { key: "reactive", label: "Reaktiv",    sub: "Rød, varm, ubekvem" },
  { key: "oily",     label: "Glinsende",  sub: "Fet, særlig T-sone" },
];

// Default metric values per feel (1–5 scale)
const FEEL_DEFAULTS: Record<SkinFeel, Record<string, number>> = {
  radiant:  { hydration: 4, redness: 1, glow: 5, sensitivity: 1, breakouts: 1 },
  balanced: { hydration: 3, redness: 2, glow: 3, sensitivity: 2, breakouts: 1 },
  tired:    { hydration: 2, redness: 2, glow: 2, sensitivity: 2, breakouts: 2 },
  tight:    { hydration: 1, redness: 2, glow: 2, sensitivity: 3, breakouts: 1 },
  reactive: { hydration: 2, redness: 5, glow: 2, sensitivity: 5, breakouts: 3 },
  oily:     { hydration: 3, redness: 2, glow: 3, sensitivity: 2, breakouts: 3 },
};

const METRICS: Array<{ key: string; label: string; lowLabel: string; highLabel: string }> = [
  { key: "hydration",   label: "Fuktighet",   lowLabel: "Tørr",    highLabel: "Fuktig" },
  { key: "redness",     label: "Rødhet",      lowLabel: "Ingen",   highLabel: "Mye" },
  { key: "glow",        label: "Glød",        lowLabel: "Matt",    highLabel: "Strålende" },
  { key: "sensitivity", label: "Sensitivitet", lowLabel: "Rolig",  highLabel: "Reaktiv" },
  { key: "breakouts",   label: "Urenheter",   lowLabel: "Ingen",   highLabel: "Mange" },
];

const TAGS = [
  { key: "breakout",        label: "Urenhet" },
  { key: "dry_patches",     label: "Tørre flekker" },
  { key: "redness",         label: "Rødhet" },
  { key: "smooth",          label: "Glatt" },
  { key: "good_foundation", label: "Foundation satt godt" },
  { key: "bad_foundation",  label: "Foundation satt dårlig" },
  { key: "slept_well",      label: "Sov godt" },
  { key: "stressed",        label: "Stresset" },
];

type FoundationStatus = "good" | "bad" | "not_worn" | null;

export default function SkinLogPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();

  const [feel, setFeel] = useState<SkinFeel | null>(null);
  const [metrics, setMetrics] = useState<Record<string, number>>({
    hydration: 3, redness: 2, glow: 3, sensitivity: 2, breakouts: 1,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [foundation, setFoundation] = useState<FoundationStatus>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function selectFeel(key: SkinFeel) {
    setFeel(key);
    setMetrics(FEEL_DEFAULTS[key]);
    setShowDetails(true);
  }

  function setMetric(key: string, val: number) {
    setMetrics((prev) => ({ ...prev, [key]: val }));
  }

  function toggleTag(key: string) {
    setTags((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  }

  async function save() {
    if (!feel) return;
    setSaving(true);

    const finalTags = [...tags];
    if (foundation === "good" && !finalTags.includes("good_foundation"))
      finalTags.push("good_foundation");
    if (foundation === "bad" && !finalTags.includes("bad_foundation"))
      finalTags.push("bad_foundation");

    const res = await fetch("/api/skin-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feel,
        metrics,
        tags: finalTags,
        freeText: note,
      }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => router.push(`/${locale}/home`), 1500);
    }
    setSaving(false);
  }

  if (saved) {
    return (
      <main className="min-h-dvh bg-bone flex items-center justify-center p-8">
        <div className="text-center">
          <div className="divider-line mx-auto mb-8" />
          <h1 className="font-display text-4xl tracking-wide2 mb-3">Logget.</h1>
          <p className="font-display italic text-soft-ink text-lg">Vi ser deg.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-bone pb-32">
      <header className="flex justify-between items-center px-6 pt-10 pb-6">
        <Link
          href={`/${locale}/home`}
          className="text-[11px] uppercase tracking-[0.24em] text-soft-ink"
        >
          ← Hjem
        </Link>
        <span className="text-[10px] uppercase tracking-[0.32em] text-mute">
          Hudlogg
        </span>
        <span className="w-12" />
      </header>

      <div className="px-6">
        {/* Date */}
        <div className="text-center mb-8">
          <div className="font-display italic text-sm text-mute mb-1">
            {formatDate(locale)}
          </div>
          <h1 className="font-display text-4xl leading-tight tracking-wide2 mb-2">
            Hvordan kjennes<br />huden i dag?
          </h1>
          <p className="font-display italic text-soft-ink text-base mt-3">
            Velg én. Juster detaljene etterpå.
          </p>
        </div>

        {/* Feel selector */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {FEELS.map((f) => (
            <button
              key={f.key}
              onClick={() => selectFeel(f.key)}
              className={`text-left px-5 py-5 border transition-all ${
                feel === f.key
                  ? "border-ink bg-ink text-bone"
                  : "border-stone/40 hover:border-ink"
              }`}
            >
              <div className="font-display text-xl mb-1">{f.label}</div>
              <div
                className={`text-xs leading-relaxed ${
                  feel === f.key ? "text-bone/70" : "text-soft-ink"
                }`}
              >
                {f.sub}
              </div>
            </button>
          ))}
        </div>

        {/* Detailed metrics — shown after feel is selected */}
        {showDetails && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="editorial-eyebrow">Juster detaljene</div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-[10px] uppercase tracking-[0.28em] text-soft-ink/60"
              >
                Skjul
              </button>
            </div>
            <div className="bg-cream px-5 py-5 space-y-5">
              {METRICS.map((m) => (
                <div key={m.key}>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-display text-sm">{m.label}</span>
                    <span className="font-display italic text-xs text-soft-ink">
                      {metrics[m.key] <= 1
                        ? m.lowLabel
                        : metrics[m.key] >= 5
                        ? m.highLabel
                        : ""}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => setMetric(m.key, v)}
                        className={`flex-1 h-2 rounded-full transition-all ${
                          v <= metrics[m.key]
                            ? "bg-ink"
                            : "bg-stone/40"
                        }`}
                        aria-label={`${m.label} ${v}`}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Foundation */}
              <div>
                <div className="font-display text-sm mb-2">Foundation</div>
                <div className="flex gap-2">
                  {(
                    [
                      { key: "good", label: "Satt godt" },
                      { key: "bad", label: "Satt dårlig" },
                      { key: "not_worn", label: "Brukte ikke" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() =>
                        setFoundation((prev) =>
                          prev === opt.key ? null : opt.key
                        )
                      }
                      className={`flex-1 py-2 border text-[10px] uppercase tracking-[0.2em] transition-colors ${
                        foundation === opt.key
                          ? "border-ink bg-ink text-bone"
                          : "border-stone/40 text-soft-ink"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="mb-8">
          <div className="editorial-eyebrow mb-3 text-center">
            Noe spesifikt?
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {TAGS.filter(
              (tg) =>
                tg.key !== "good_foundation" && tg.key !== "bad_foundation"
            ).map((tg) => (
              <button
                key={tg.key}
                onClick={() => toggleTag(tg.key)}
                className={`px-3 py-2 border text-xs font-display transition-colors ${
                  tags.includes(tg.key)
                    ? "border-ink bg-ink text-bone"
                    : "border-stone/40 text-soft-ink"
                }`}
              >
                {tg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Free text */}
        <div className="mb-10">
          <div className="editorial-eyebrow mb-3 text-center">
            Egne ord
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Frivillig"
            className="w-full bg-cream border-none p-4 font-display italic text-base text-ink placeholder:text-mute resize-none focus:outline-none focus:ring-1 focus:ring-ink"
            rows={3}
          />
        </div>

        <button
          onClick={save}
          disabled={!feel || saving}
          className="btn-primary disabled:opacity-40"
        >
          {saving ? "Lagrer…" : "Lagre dagens logg"}
        </button>
      </div>

      <BottomNav locale={locale} />
    </main>
  );
}

function formatDate(locale: string): string {
  return new Date().toLocaleDateString(locale === "no" ? "nb-NO" : locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
