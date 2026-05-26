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

// ── Section parser ───────────────────────────────────────────────────────
type Section =
  | { key: "answer";   label: "Svar";              body: string }
  | { key: "need";     label: "Huden trenger nå";  body: string }
  | { key: "avoid";    label: "Unngå i dag";       body: string }
  | { key: "yours";    label: "Fra din pung";      body: string }
  | { key: "alts";     label: "Gode alternativer"; body: string }
  | { key: "note";     label: "Notat";             body: string };

const MARKERS: Array<[Section["key"], Section["label"], RegExp]> = [
  ["answer", "Svar",              /\[SVAR\]/i],
  ["need",   "Huden trenger nå",  /\[HUDEN TRENGER\]/i],
  ["avoid",  "Unngå i dag",       /\[UNNGÅ I DAG\]/i],
  ["yours",  "Fra din pung",      /\[FRA DIN PUNG\]/i],
  ["alts",   "Gode alternativer", /\[GODE ALTERNATIVER\]/i],
  ["note",   "Notat",             /\[NOTAT\]/i],
];

function parseSections(text: string): Section[] {
  // Find each marker position
  const hits: Array<{ key: Section["key"]; label: Section["label"]; pos: number; matchLen: number }> = [];
  for (const [key, label, re] of MARKERS) {
    const m = text.match(re);
    if (m && m.index != null) {
      hits.push({ key, label, pos: m.index, matchLen: m[0].length });
    }
  }
  if (hits.length === 0) {
    // No markers found — treat the whole thing as answer
    return [{ key: "answer", label: "Svar", body: text.trim() } as Section];
  }
  hits.sort((a, b) => a.pos - b.pos);
  const result: Section[] = [];
  for (let i = 0; i < hits.length; i++) {
    const cur = hits[i];
    const next = hits[i + 1];
    const start = cur.pos + cur.matchLen;
    const end = next ? next.pos : text.length;
    const body = text.slice(start, end).trim();
    if (body) result.push({ key: cur.key, label: cur.label, body } as Section);
  }
  return result;
}

/** Render a section body, linking product mentions to product pages */
function SectionBody({
  text,
  products,
  locale,
}: {
  text: string;
  products?: MentionedProduct[];
  locale: string;
}) {
  if (!products?.length) return <>{text}</>;

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

  const clean: typeof mentions = [];
  let cursor = 0;
  for (const m of mentions) {
    if (m.start >= cursor) {
      clean.push(m);
      cursor = m.end;
    }
  }

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

function ModuleCard({
  section,
  products,
  locale,
}: {
  section: Section;
  products?: MentionedProduct[];
  locale: string;
}) {
  const styles: Record<Section["key"], string> = {
    answer: "bg-ink text-bone",
    need:   "bg-cream",
    avoid:  "border border-stone/40",
    yours:  "bg-cream",
    alts:   "border border-stone/40",
    note:   "border-l-2 border-mute/40 pl-4 py-1",
  };
  const labelStyles: Record<Section["key"], string> = {
    answer: "text-bone/50",
    need:   "text-mute",
    avoid:  "text-accent",
    yours:  "text-mute",
    alts:   "text-mute",
    note:   "text-mute",
  };
  const isInk = section.key === "answer";
  const containerCls = section.key === "note"
    ? styles[section.key]
    : `${styles[section.key]} px-5 py-4`;

  return (
    <div className={containerCls}>
      <div
        className={`text-[10px] uppercase tracking-[0.4em] mb-2 ${labelStyles[section.key]}`}
      >
        {section.label}
      </div>
      <p
        className={`font-display text-sm leading-relaxed whitespace-pre-wrap ${
          isInk ? "text-bone" : "text-soft-ink"
        }`}
      >
        <SectionBody text={section.body} products={products} locale={locale} />
      </p>
    </div>
  );
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
          {isPro ? "Rådgiveren · Pro" : "Rådgiveren"}
        </div>
        <h1 className="font-display text-4xl tracking-wide2 mb-1">
          Hva trenger huden<br />din i dag?
        </h1>
        {!inConversation && (
          <p className="font-display italic text-soft-ink text-sm mt-3 leading-relaxed">
            Kjenner palett, pung og historikk. Svarer kort.
          </p>
        )}
      </div>

      {/* Context card */}
      {!inConversation && contextSummary && (
        <div className="bg-cream px-5 py-3 mb-6">
          <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-1">
            Kjenner til
          </div>
          <p className="font-display italic text-xs text-soft-ink leading-relaxed">
            {contextSummary}
          </p>
        </div>
      )}

      {/* Error states */}
      {error === "upgrade_required" && (
        <div className="bg-cream px-6 py-6 text-center mb-7">
          <p className="font-display text-base mb-1">Rådgiveren er en Pro-funksjon.</p>
          <p className="font-display italic text-sm text-soft-ink mb-5">
            Oppgrader for personlig rådgivning basert på din historikk.
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
          <p className="font-display italic text-sm text-soft-ink">Nullstilles neste måned.</p>
        </div>
      )}
      {error === "error" && (
        <div className="bg-cream px-5 py-4 mb-7">
          <p className="font-display text-sm text-soft-ink">Noe gikk galt. Prøv igjen.</p>
        </div>
      )}

      {/* Suggested questions */}
      {!inConversation && !error && (
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            Tilpasset deg
          </div>
          <div className="space-y-2">
            {personalQuestions.slice(0, 4).map((q) => (
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
        <div className="space-y-7 mb-7">
          {thread.map((turn, i) => {
            const sections = parseSections(turn.a);
            return (
              <div key={i}>
                {/* User question */}
                <div className="flex justify-end mb-4">
                  <div className="bg-stone/30 px-4 py-3 max-w-[85%]">
                    <p className="font-display text-sm leading-relaxed">{turn.q}</p>
                  </div>
                </div>
                {/* Module cards */}
                <div className="space-y-3">
                  {sections.map((s, j) => (
                    <ModuleCard
                      key={`${i}-${j}-${s.key}`}
                      section={s}
                      products={turn.mentionedProducts}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {loading && <LoadingCard />}
        </div>
      )}

      {loading && thread.length === 0 && (
        <div className="mb-7">
          <LoadingCard />
        </div>
      )}

      <div ref={bottomRef} />

      {/* Input */}
      <div className="mb-7">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={inConversation ? "Fortsett samtalen…" : "Skriv et spørsmål…"}
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
              Ny
            </button>
          )}
        </div>
      </div>

      <p className="text-[10px] tracking-wider text-mute text-center mt-8 leading-relaxed">
        Rådgiveren er kosmetisk veiledning, ikke medisinsk profesjon.
      </p>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="bg-cream px-5 py-5">
      <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-2">
        Tenker
      </div>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-soft-ink/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-soft-ink/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-soft-ink/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
