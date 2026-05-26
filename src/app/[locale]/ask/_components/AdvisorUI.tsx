"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface MentionedProduct {
  id: string;
  brand: string;
  name: string;
}

interface Turn {
  q: string;
  a: string;
  mentionedProducts?: MentionedProduct[];
}

interface Props {
  locale: string;
  isPro: boolean;
  contextSummary: string | null;
  personalQuestions: string[];
}

/** Splits answer text and wraps catalog product mentions in links */
function AnswerText({
  text,
  products,
  locale,
}: {
  text: string;
  products?: MentionedProduct[];
  locale: string;
}) {
  if (!products?.length) {
    return <>{text}</>;
  }

  // Collect all (start, end, product) mentions, sorted by position
  const mentions: { start: number; end: number; product: MentionedProduct }[] = [];
  const lowerText = text.toLowerCase();

  for (const p of products) {
    const needle = `${p.brand} ${p.name}`.toLowerCase();
    let pos = 0;
    while (pos < lowerText.length) {
      const idx = lowerText.indexOf(needle, pos);
      if (idx === -1) break;
      mentions.push({ start: idx, end: idx + needle.length, product: p });
      pos = idx + needle.length;
    }
  }

  mentions.sort((a, b) => a.start - b.start);

  // Remove overlapping mentions (keep first)
  const clean: typeof mentions = [];
  let cursor = 0;
  for (const m of mentions) {
    if (m.start >= cursor) {
      clean.push(m);
      cursor = m.end;
    }
  }

  // Build React nodes
  const nodes: React.ReactNode[] = [];
  let pos = 0;
  for (const m of clean) {
    if (m.start > pos) nodes.push(text.slice(pos, m.start));
    nodes.push(
      <Link
        key={`${m.product.id}-${m.start}`}
        href={`/${locale}/products/${m.product.id}`}
        className="underline underline-offset-2 decoration-soft-ink/40 hover:decoration-ink transition-colors"
      >
        {text.slice(m.start, m.end)}
      </Link>
    );
    pos = m.end;
  }
  if (pos < text.length) nodes.push(text.slice(pos));

  return <>{nodes}</>;
}

export default function AdvisorUI({
  locale,
  isPro,
  contextSummary,
  personalQuestions,
}: Props) {
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, loading]);

  async function ask() {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion("");
    setLoading(true);
    setError("");

    const res = await fetch("/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: q,
        includeProfile: true,
        conversationHistory: thread,
      }),
    });

    if (res.status === 402) { setError("upgrade_required"); setLoading(false); return; }
    if (res.status === 429) { setError("quota_exceeded"); setLoading(false); return; }

    const data = await res.json();
    if (data.answer) {
      setThread((prev) => [
        ...prev,
        { q, a: data.answer, mentionedProducts: data.mentionedProducts ?? [] },
      ]);
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

  function reset() {
    setThread([]);
    setError("");
    setQuestion("");
  }

  const inConversation = thread.length > 0;

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
        {!inConversation && (
          <p className="font-display italic text-soft-ink text-base mt-3 leading-relaxed">
            Kjenner huden din, produktene dine og historikken din.<br />
            Svarer med kunnskap — ikke salgsspråk.
          </p>
        )}
      </div>

      {/* Context card — only before conversation starts */}
      {!inConversation && contextSummary && (
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
          <p className="font-display text-base mb-1">AI-rådgiveren er en Pro-funksjon.</p>
          <p className="font-display italic text-sm text-soft-ink mb-5">
            Oppgrader for å få personlig rådgivning basert på din hudhistorikk.
          </p>
          <Link href={`/${locale}/upgrade`}
            className="inline-block bg-ink text-bone px-6 py-3 text-[11px] uppercase tracking-[0.32em]">
            Se Pro · 14 dagers prøvetid
          </Link>
        </div>
      )}
      {error === "quota_exceeded" && (
        <div className="bg-cream px-6 py-6 text-center mb-7">
          <p className="font-display text-base mb-1">Du har nådd månedens grense.</p>
          <p className="font-display italic text-sm text-soft-ink">Grensen nullstilles neste måned.</p>
        </div>
      )}
      {error === "error" && (
        <div className="bg-cream px-5 py-4 mb-7">
          <p className="font-display text-sm text-soft-ink">Noe gikk galt. Prøv igjen.</p>
        </div>
      )}

      {/* Suggested questions — only before conversation */}
      {!inConversation && !error && (
        <div className="mb-7">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            Spørsmål tilpasset deg
          </div>
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

      {/* Conversation thread */}
      {thread.length > 0 && (
        <div className="space-y-6 mb-7">
          {thread.map((turn, i) => (
            <div key={i}>
              {/* User question */}
              <div className="flex justify-end mb-3">
                <div className="bg-ink text-bone px-4 py-3 max-w-[85%]">
                  <p className="font-display text-sm leading-relaxed">{turn.q}</p>
                </div>
              </div>
              {/* AI answer */}
              <div className="bg-cream px-5 py-5">
                <div className="text-[9px] uppercase tracking-[0.32em] text-mute mb-2">
                  Rådgiveren
                </div>
                <p className="font-display text-sm leading-relaxed whitespace-pre-wrap">
                  <AnswerText
                    text={turn.a}
                    products={turn.mentionedProducts}
                    locale={locale}
                  />
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="bg-cream px-5 py-5">
              <div className="text-[9px] uppercase tracking-[0.32em] text-mute mb-2">Rådgiveren</div>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-soft-ink/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-soft-ink/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-soft-ink/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading before first answer */}
      {loading && thread.length === 0 && (
        <div className="bg-cream px-5 py-5 mb-7">
          <div className="text-[9px] uppercase tracking-[0.32em] text-mute mb-2">Rådgiveren</div>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-soft-ink/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-soft-ink/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-soft-ink/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      <div ref={bottomRef} />

      {/* Input */}
      <div className="mb-7">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={inConversation ? "Fortsett samtalen…" : "Ditt spørsmål…"}
          rows={3}
          className="w-full bg-cream border-none p-4 font-display text-base focus:outline-none focus:ring-1 focus:ring-ink resize-none"
        />
        <div className="flex gap-3 mt-3">
          <button
            onClick={ask}
            disabled={loading || !question.trim()}
            className="btn-primary flex-1 disabled:opacity-40"
          >
            {loading ? "Tenker…" : inConversation ? "Send" : "Spør"}
          </button>
          {inConversation && (
            <button
              onClick={reset}
              className="px-4 py-3 border border-stone/40 text-[10px] uppercase tracking-[0.28em] text-soft-ink hover:border-ink transition-colors"
            >
              Ny samtale
            </button>
          )}
        </div>
      </div>

      <p className="text-[10px] tracking-wider text-mute text-center mt-8 leading-relaxed">
        Toneups rådgiver er en kosmetisk veileder, ikke medisinsk profesjon.<br />
        Ved hudtilstander, kontakt hudlege.
      </p>
    </div>
  );
}
