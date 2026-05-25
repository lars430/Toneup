"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * AI-rådgiver side
 *
 * Bruker kan stille spørsmål om produkter, ingredienser, rutiner.
 * Pro-funksjon. Vi sender ikke huddata uten samtykke.
 */

export default function AskPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Array<{ q: string; a: string }>>([]);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    setAnswer("");

    const res = await fetch("/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, includeProfile: true }),
    });

    if (res.status === 402) {
      setError("upgrade_required");
      setLoading(false);
      return;
    }
    if (res.status === 429) {
      setError("quota_exceeded");
      setLoading(false);
      return;
    }

    const data = await res.json();
    if (data.answer) {
      setAnswer(data.answer);
      setHistory((h) => [{ q: question, a: data.answer }, ...h]);
      setQuestion("");
    } else {
      setError("error");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-bone pb-32">
      <div className="max-w-md mx-auto px-7 py-10">
        <div className="text-center mb-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            Toneup rådgiver
          </div>
          <h1 className="font-display text-4xl tracking-wide2 mb-2">
            Spør om hva som helst
          </h1>
          <p className="font-display italic text-soft-ink text-base mt-3 leading-relaxed">
            Produkter, ingredienser, ritualer.<br />
            Vi svarer med kunnskap, ikke salgsspråk.
          </p>
        </div>

        {error === "upgrade_required" && (
          <div className="bg-cream p-6 text-center mb-7">
            <p className="font-display text-base mb-3">
              AI-rådgiveren er en Pro-funksjon.
            </p>
            <Link href={`/${locale}/upgrade`}
              className="inline-block bg-ink text-bone px-6 py-3 text-[11px] uppercase tracking-[0.32em]">
              Se Pro
            </Link>
          </div>
        )}

        {error === "quota_exceeded" && (
          <div className="bg-cream p-6 text-center mb-7">
            <p className="font-display text-base">
              Du har nådd månedens grense for spørsmål.
            </p>
          </div>
        )}

        {/* Suggested questions */}
        {history.length === 0 && !answer && (
          <div className="mb-7">
            <div className="editorial-eyebrow mb-3">Foreslåtte spørsmål</div>
            <div className="space-y-2">
              {[
                "Hvordan bygger jeg en god kveldsrutine for tørr hud?",
                "Er retinol trygt under graviditet?",
                "Hva er forskjellen på AHA og BHA?",
                "Kan jeg bruke vitamin C og niacinamid samme dag?",
              ].map((q) => (
                <button key={q} onClick={() => setQuestion(q)}
                  className="block w-full text-left bg-cream px-4 py-3 font-display text-sm text-soft-ink hover:bg-stone/30 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Question input */}
        <div className="mb-7">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ditt spørsmål…"
            rows={3}
            className="w-full bg-cream border-none p-4 font-display text-base focus:outline-none focus:ring-1 focus:ring-ink resize-none"
          />
          <button onClick={ask} disabled={loading || !question.trim()}
            className="btn-primary mt-3 disabled:opacity-40">
            {loading ? "Tenker…" : "Spør"}
          </button>
        </div>

        {/* Current answer */}
        {answer && (
          <div className="bg-cream p-6 mb-7">
            <div className="editorial-eyebrow mb-3">Svar</div>
            <div className="font-display text-base leading-relaxed whitespace-pre-wrap">
              {answer}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div className="mt-12">
            <div className="editorial-eyebrow mb-5">Tidligere</div>
            {history.slice(1).map((h, i) => (
              <details key={i} className="mb-3 border-b border-stone/30 pb-3">
                <summary className="font-display text-base cursor-pointer">
                  {h.q}
                </summary>
                <p className="font-display text-sm text-soft-ink mt-3 leading-relaxed whitespace-pre-wrap">
                  {h.a}
                </p>
              </details>
            ))}
          </div>
        )}

        <p className="text-[10px] tracking-wider text-mute text-center mt-12 leading-relaxed">
          Toneups rådgiver er en kosmetisk veileder, ikke medisinsk profesjon.<br />
          Ved hudtilstander, kontakt hudlege.
        </p>
      </div>
    </main>
  );
}
