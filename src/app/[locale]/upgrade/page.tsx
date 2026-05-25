"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const FEATURES_LIST = [
  "Ubegrensede hudanalyser",
  "Sesongprofil som lærer deg å kjenne over tid",
  "AI-rådgiver for produkt-spørsmål",
  "Før og etter-galleri av huden din",
  "Delbare palette-kort for Instagram",
  "Anonymisert kunnskap fra andre med din palett",
  "Full produktkatalog uten begrensninger",
];

export default function UpgradePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations();
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);

  async function checkout(tier: "pro" | "pro_annual") {
    setLoading(tier === "pro" ? "monthly" : "annual");
    const res = await fetch("/api/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  return (
    <main className="min-h-screen bg-bone">
      <div className="max-w-md mx-auto px-7 py-12">
        <div className="text-center mb-12">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">
            Toneup Pro
          </div>
          <h1 className="font-display text-5xl leading-tight tracking-wide2 mb-4">
            En personlig<br />rådgiver, alltid.
          </h1>
          <p className="font-display italic text-soft-ink text-lg max-w-xs mx-auto">
            For deg som vil at hudens reise skal følges nøye, sesong for sesong.
          </p>
        </div>

        {/* Features list */}
        <div className="mb-12">
          {FEATURES_LIST.map((f, i) => (
            <div key={i} className="flex items-start gap-3 mb-4 pb-4 border-b border-stone/30 last:border-b-0">
              <span className="font-display italic text-mute mt-0.5">
                {romanNumeral(i + 1)}
              </span>
              <span className="font-display text-base leading-relaxed">{f}</span>
            </div>
          ))}
        </div>

        {/* Pricing cards */}
        <div className="space-y-4 mb-8">
          {/* Annual - recommended */}
          <button
            onClick={() => checkout("pro_annual")}
            disabled={loading !== null}
            className="w-full text-left border-2 border-ink p-7 bg-cream disabled:opacity-50"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-accent mb-1">
                  Mest populær
                </div>
                <div className="font-display text-2xl">Toneup Pro Annual</div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl">990 kr</div>
                <div className="text-[10px] uppercase tracking-wider text-mute">/ år</div>
              </div>
            </div>
            <div className="font-display italic text-soft-ink text-sm border-t border-stone/40 pt-3">
              Tilsvarer 82,50 kr/mnd · 2 måneder gratis
            </div>
            {loading === "annual" && (
              <div className="text-xs text-mute mt-3">Forbereder kassen…</div>
            )}
          </button>

          {/* Monthly */}
          <button
            onClick={() => checkout("pro")}
            disabled={loading !== null}
            className="w-full text-left border border-stone p-7 disabled:opacity-50"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-1">
                  Fleksibel
                </div>
                <div className="font-display text-2xl">Toneup Pro</div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl">99 kr</div>
                <div className="text-[10px] uppercase tracking-wider text-mute">/ mnd</div>
              </div>
            </div>
            <div className="font-display italic text-soft-ink text-sm border-t border-stone/40 pt-3">
              Avslutt når som helst
            </div>
            {loading === "monthly" && (
              <div className="text-xs text-mute mt-3">Forbereder kassen…</div>
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.32em] text-accent mb-3">
            14 dagers gratis prøveperiode
          </p>
          <p className="text-xs text-soft-ink leading-relaxed max-w-xs mx-auto">
            Du blir ikke belastet før prøveperioden er over. Avslutt når som helst.
          </p>
        </div>

        <div className="divider-line mx-auto my-10" />

        <p className="text-[10px] tracking-wider text-mute text-center leading-relaxed">
          Sikker betaling via Stripe.<br />
          Toneup håndterer ikke kortdetaljer direkte.
        </p>
      </div>
    </main>
  );
}

function romanNumeral(n: number): string {
  const r = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return r[n - 1] ?? String(n);
}
