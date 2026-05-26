"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  locale: string;
  isPro: boolean;
  contextSummary: string | null;
  personalQuestions: string[];
}

export default function AdvisorUI({
  locale,
  isPro,
  contextSummary,
  personalQuestions,
}: Props) {
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-10 pb-6">

      {/* Header */}
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
          {isPro ? "Toneup Pro · Rådgiveren" : "Toneup Rådgiver"}
        </div>
        <h1 className="font-display text-4xl tracking-wide2 mb-2">
          Din personlige<br />beauty-rådgiver
        </h1>
        <p className="font-display italic text-soft-ink text-base mt-3 leading-relaxed">
          Kjenner huden din, produktene dine og historikken din.<br />
          Svarer med kunnskap — ikke salgsspråk.
        </p>
      </div>

      {/* Context card — what the advisor knows */}
      {contextSummary && (
        <div className="bg-cream px-5 py-4 mb-7">
          <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-2">
            Rådgiveren kjenner til
          </div>
          <p className="font-display italic text-sm text-soft-ink leading-relaxed">
            {contextSummary}
          </p>
        </div>
      )}

      {/* Error states */}
      {error === "upgrade_required" && (
        <div className="bg-cream px-6 py-6 text-center mb-7">
          <p className="font-display text-base mb-1">
            AI-rådgiveren er en Pro-funksjon.
          </p>
          <p className="font-display italic text-sm text-soft-ink mb-5">
            Oppgrader for å få personlig rådgivning basert på din hudhistorikk.
          </p>
          <Link
            href={`/${locale}/upgrade`}
            className="inline-block bg-ink text-bone px-6 py-3 text-[11px] uppercase tracking-[0.32em]"
          >
            Se Pro · 14 dagers prøvetid
          </Link>
        </div>
      )}

      {error === "quota_exceeded" && (
        <div className="bg-cream px-6 py-6 text-center mb-7">
          <p className="font-display text-base mb-1">
            Du har nådd månedens grense for spørsmål.
          </p>
          <p className="font-display italic text-sm text-soft-ink">
            Grensen nullstilles neste måned.
          </p>
        </div>
      )}

      {error === "error" && (
        <div className="bg-cream px-5 py-4 mb-7">
          <p className="font-display text-sm text-soft-ink">
            Noe gikk galt. Prøv igjen.
          </p>
        </div>
      )}

      {/* Personalized suggested questions */}
      {history.length === 0 && !answer && !error && (
        <div className="mb-7">
          <div className="editorial-eyebrow mb-3">Spørsmål tilpasset deg</div>
          <div className="space-y-2">
            {personalQuestions.map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="block w-full text-left bg-cream px-4 py-3 font-display text-sm text-soft-ink hover:bg-stone/30 transition-colors"
              >
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
          onKeyDown={handleKeyDown}
          placeholder="Ditt spørsmål…"
          rows={3}
          className="w-full bg-cream border-none p-4 font-display text-base focus:outline-none focus:ring-1 focus:ring-ink resize-none"
        />
        <button
          onClick={ask}
          disabled={loading || !question.trim()}
          className="btn-primary mt-3 disabled:opacity-40"
        >
          {loading ? "Tenker…" : "Spør"}
        </button>
      </div>

      {/* Current answer */}
      {answer && (
        <div className="bg-cream px-6 py-6 mb-7">
          <div className="editorial-eyebrow mb-3">Svar</div>
          <div className="font-display text-base leading-relaxed whitespace-pre-wrap">
            {answer}
          </div>
          <button
            onClick={() => {
              setAnswer("");
              setQuestion("");
            }}
            className="mt-5 text-[10px] uppercase tracking-[0.3em] text-soft-ink underline underline-offset-4"
          >
            Nytt spørsmål
          </button>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="mt-10">
          <div className="editorial-eyebrow mb-5">Tidligere spørsmål</div>
          {history.slice(1).map((h, i) => (
            <details key={i} className="mb-3 border-b border-stone/30 pb-3">
              <summary className="font-display text-base cursor-pointer py-1">
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
  );
}
