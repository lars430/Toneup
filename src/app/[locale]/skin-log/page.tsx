"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

type SkinFeel = "radiant" | "balanced" | "tired" | "tight" | "reactive" | "oily";

const FEELS: Array<{ key: SkinFeel; label: string; sub: string }> = [
  { key: "radiant",  label: "Strålende", sub: "Glød, livfull" },
  { key: "balanced", label: "Balansert",  sub: "Rolig, harmonisk" },
  { key: "tired",    label: "Trett",      sub: "Matt, livløs" },
  { key: "tight",    label: "Stram",      sub: "Tørr, ber om fukt" },
  { key: "reactive", label: "Reaktiv",    sub: "Rød, varm" },
  { key: "oily",     label: "Glinsende",  sub: "Fet, særlig T-sone" },
];

const FEEL_DEFAULTS: Record<SkinFeel, Record<string, number>> = {
  radiant:  { hydration: 4, redness: 1, glow: 5, sensitivity: 1, breakouts: 1 },
  balanced: { hydration: 3, redness: 2, glow: 3, sensitivity: 2, breakouts: 1 },
  tired:    { hydration: 2, redness: 2, glow: 2, sensitivity: 2, breakouts: 2 },
  tight:    { hydration: 1, redness: 2, glow: 2, sensitivity: 3, breakouts: 1 },
  reactive: { hydration: 2, redness: 5, glow: 2, sensitivity: 5, breakouts: 3 },
  oily:     { hydration: 3, redness: 2, glow: 3, sensitivity: 2, breakouts: 3 },
};

const QUICK_TAGS = [
  { key: "dry_patches",  label: "Tørre flekker" },
  { key: "redness",      label: "Rødhet" },
  { key: "breakout",     label: "Urenhet" },
  { key: "smooth",       label: "Glatt" },
];

const METRICS: Array<{ key: string; label: string; lowLabel: string; highLabel: string }> = [
  { key: "hydration",   label: "Fuktighet",    lowLabel: "Tørr",   highLabel: "Fuktig" },
  { key: "redness",     label: "Rødhet",       lowLabel: "Ingen",  highLabel: "Mye" },
  { key: "glow",        label: "Glød",         lowLabel: "Matt",   highLabel: "Strålende" },
  { key: "sensitivity", label: "Sensitivitet", lowLabel: "Rolig",  highLabel: "Reaktiv" },
  { key: "breakouts",   label: "Urenheter",    lowLabel: "Ingen",  highLabel: "Mange" },
];

const EXTRA_TAGS = [
  { key: "stressed",         label: "Stresset" },
  { key: "slept_well",       label: "Sov godt" },
  { key: "good_foundation",  label: "Foundation satt godt" },
  { key: "bad_foundation",   label: "Foundation satt dårlig" },
];

export default function SkinLogPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();

  const [feel, setFeel] = useState<SkinFeel | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [advanced, setAdvanced] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, number>>({
    hydration: 3, redness: 2, glow: 3, sensitivity: 2, breakouts: 1,
  });
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function selectFeel(key: SkinFeel) {
    setFeel(key);
    setMetrics(FEEL_DEFAULTS[key]);
  }

  function toggleTag(key: string) {
    setTags((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  }

  function setMetric(key: string, val: number) {
    setMetrics((prev) => ({ ...prev, [key]: val }));
  }

  async function save() {
    if (!feel) return;
    setSaving(true);
    const res = await fetch("/api/skin-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feel,
        metrics: advanced ? metrics : undefined,
        tags,
        freeText: note || undefined,
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
          <h1 className="font-display text-4xl tracking-wide2 mb-3">Notert.</h1>
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
          Hudnotat
        </span>
        <span className="w-12" />
      </header>

      <div className="px-6">
        <div className="text-center mb-8">
          <div className="font-display italic text-sm text-mute mb-1">
            {formatDate(locale)}
          </div>
          <h1 className="font-display text-4xl leading-tight tracking-wide2 mb-2">
            Kjapt notat<br />om huden
          </h1>
          <p className="font-display italic text-soft-ink text-base mt-3">
            Velg én. Lagre i fem sekunder.
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

        {/* Quick tags */}
        <div className="mb-6">
          <div className="editorial-eyebrow mb-3 text-center">Noe spesifikt?</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {QUICK_TAGS.map((tg) => (
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

        {/* Advanced toggle */}
        <div className="mb-8">
          <button
            onClick={() => setAdvanced((v) => !v)}
            className="w-full text-center text-[10px] uppercase tracking-[0.32em] text-soft-ink/50 py-3 border border-dashed border-stone/25 hover:border-stone/50 hover:text-soft-ink/70 transition-colors"
          >
            {advanced ? "Skjul detaljer ↑" : "Avansert logg →"}
          </button>
        </div>

        {/* Advanced section */}
        {advanced && (
          <div className="mb-8 space-y-6">
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
                          v <= metrics[m.key] ? "bg-ink" : "bg-stone/40"
                        }`}
                        aria-label={`${m.label} ${v}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {EXTRA_TAGS.map((tg) => (
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

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Egne ord (frivillig)"
              className="w-full bg-cream border-none p-4 font-display italic text-base text-ink placeholder:text-mute resize-none focus:outline-none focus:ring-1 focus:ring-ink"
              rows={3}
            />
          </div>
        )}

        <button
          onClick={save}
          disabled={!feel || saving}
          className="btn-primary disabled:opacity-40"
        >
          {saving ? "Lagrer…" : "Lagre"}
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
