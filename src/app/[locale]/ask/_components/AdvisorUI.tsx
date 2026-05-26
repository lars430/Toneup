"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface MentionedProduct {
  id: string;
  brand: string;
  name: string;
  hex?: string | null;
  shadeName?: string | null;
}

interface Turn {
  q: string;
  a: string;
  mentionedProducts?: MentionedProduct[];
}

type AddState = "idle" | "loading" | "added" | "exists" | "limit" | "error";

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

type ProposedAction =
  | { type: "legg_i_pung"; label: string }
  | { type: "flytt_til_onskeliste"; label: string }
  | {
      type: "logg_hud";
      feel?: string;
      metrics?: Record<string, number>;
      tags?: string[];
      freeText?: string;
    };

const MARKERS: Array<[Section["key"] | "actions", string, RegExp]> = [
  ["answer",  "Svar",              /\[SVAR\]/i],
  ["need",    "Huden trenger nå",  /\[HUDEN TRENGER\]/i],
  ["avoid",   "Unngå i dag",       /\[UNNGÅ I DAG\]/i],
  ["yours",   "Fra din pung",      /\[FRA DIN PUNG\]/i],
  ["alts",    "Gode alternativer", /\[GODE ALTERNATIVER\]/i],
  ["note",    "Notat",             /\[NOTAT\]/i],
  ["actions", "Handlinger",        /\[HANDLINGER\]/i],
];

function parseAnswer(text: string): { sections: Section[]; actions: ProposedAction[] } {
  const hits: Array<{ key: typeof MARKERS[number][0]; label: string; pos: number; matchLen: number }> = [];
  for (const [key, label, re] of MARKERS) {
    const m = text.match(re);
    if (m && m.index != null) {
      hits.push({ key, label, pos: m.index, matchLen: m[0].length });
    }
  }
  if (hits.length === 0) {
    return {
      sections: [{ key: "answer", label: "Svar", body: text.trim() } as Section],
      actions: [],
    };
  }
  hits.sort((a, b) => a.pos - b.pos);

  const sections: Section[] = [];
  let actions: ProposedAction[] = [];

  for (let i = 0; i < hits.length; i++) {
    const cur = hits[i];
    const next = hits[i + 1];
    const start = cur.pos + cur.matchLen;
    const end = next ? next.pos : text.length;
    const body = text.slice(start, end).trim();
    if (!body) continue;

    if (cur.key === "actions") {
      actions = extractActions(body);
    } else {
      sections.push({ key: cur.key, label: cur.label, body } as Section);
    }
  }
  return { sections, actions };
}

function extractActions(body: string): ProposedAction[] {
  // Strip code fences if present, find the first {...} JSON object.
  const cleaned = body
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return [];
  const candidate = cleaned.slice(first, last + 1);
  try {
    const parsed = JSON.parse(candidate);
    if (Array.isArray(parsed?.actions)) {
      return parsed.actions.filter((a: any) => a && typeof a.type === "string");
    }
  } catch {
    // ignore — malformed JSON yields no actions
  }
  return [];
}

function ModuleCard({ section }: { section: Section }) {
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
        {section.body}
      </p>
    </div>
  );
}

function ProposedActionsCard({
  turnIndex,
  actions,
}: {
  turnIndex: number;
  actions: ProposedAction[];
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "cancelled">("idle");
  const [results, setResults] = useState<Array<{ ok: boolean; message: string }>>([]);

  async function confirm() {
    setStatus("loading");
    try {
      const res = await fetch("/api/ai/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
      setStatus("done");
    } catch {
      setResults([{ ok: false, message: "Noe gikk galt. Prøv igjen." }]);
      setStatus("done");
    }
  }

  if (status === "cancelled") return null;

  if (status === "done") {
    return (
      <div className="mt-3 border border-stone/40 px-5 py-4">
        <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-2">
          Utført
        </div>
        <ul className="space-y-1">
          {results.map((r, i) => (
            <li
              key={`${turnIndex}-${i}`}
              className={`font-display text-sm leading-relaxed ${
                r.ok ? "text-soft-ink" : "text-accent"
              }`}
            >
              {r.ok ? "✓ " : "· "}
              {r.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-3 border border-ink px-5 py-4">
      <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-3">
        Foreslåtte handlinger
      </div>
      <ul className="space-y-1 mb-4">
        {actions.map((a, i) => (
          <li
            key={`${turnIndex}-${i}`}
            className="font-display text-sm leading-relaxed text-soft-ink"
          >
            · {actionLabel(a)}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <button
          onClick={confirm}
          disabled={status === "loading"}
          className="flex-1 bg-ink text-bone py-3 text-[11px] uppercase tracking-[0.32em] disabled:opacity-50"
        >
          {status === "loading" ? "Utfører…" : "Bekreft"}
        </button>
        <button
          onClick={() => setStatus("cancelled")}
          disabled={status === "loading"}
          className="px-5 py-3 border border-stone/40 text-[10px] uppercase tracking-[0.28em] text-soft-ink"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}

function actionLabel(a: ProposedAction): string {
  if (a.type === "legg_i_pung") return `Legg i pungen: ${a.label}`;
  if (a.type === "flytt_til_onskeliste") return `Legg på ønskelisten: ${a.label}`;
  if (a.type === "logg_hud") {
    const feel = a.feel ? ` (${feelLabel(a.feel)})` : "";
    return `Logg huden i dag${feel}`;
  }
  return "Ukjent handling";
}

function feelLabel(key: string): string {
  const m: Record<string, string> = {
    radiant: "Strålende",
    balanced: "Balansert",
    tired: "Trett",
    tight: "Stram",
    reactive: "Reaktiv",
    oily: "Glinsende",
  };
  return m[key] ?? key;
}

function MentionedProductsRow({
  products,
  locale,
}: {
  products: MentionedProduct[];
  locale: string;
}) {
  const [states, setStates] = useState<Record<string, AddState>>({});

  async function addToBag(productId: string) {
    setStates((s) => ({ ...s, [productId]: "loading" }));
    try {
      const res = await fetch("/api/bag/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setStates((s) => ({ ...s, [productId]: "added" }));
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data?.error === "already_in_bag") {
        setStates((s) => ({ ...s, [productId]: "exists" }));
      } else if (data?.error === "bag_limit_reached") {
        setStates((s) => ({ ...s, [productId]: "limit" }));
      } else {
        setStates((s) => ({ ...s, [productId]: "error" }));
      }
    } catch {
      setStates((s) => ({ ...s, [productId]: "error" }));
    }
  }

  if (!products?.length) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.32em] text-mute">
        Nevnte produkter
      </div>
      <div className="space-y-2">
        {products.map((p) => {
          const state = states[p.id] ?? "idle";
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 bg-cream px-3 py-3"
            >
              <Link
                href={`/${locale}/products/${p.id}`}
                className="flex items-center gap-3 flex-1 min-w-0 group"
              >
                <div
                  className="w-9 h-9 flex-shrink-0 rounded-sm border border-stone/30"
                  style={{ background: p.hex ?? "#D9CFC1" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm truncate group-hover:opacity-70 transition-opacity">
                    {p.name}
                  </div>
                  <div className="font-display italic text-[11px] text-soft-ink truncate">
                    {p.brand}
                    {p.shadeName && ` · ${p.shadeName}`}
                  </div>
                </div>
              </Link>
              <button
                onClick={() => addToBag(p.id)}
                disabled={
                  state === "loading" ||
                  state === "added" ||
                  state === "exists" ||
                  state === "limit"
                }
                className={`flex-shrink-0 px-3 py-2 text-[10px] uppercase tracking-[0.24em] border transition-colors ${
                  state === "added" || state === "exists"
                    ? "border-stone/40 text-mute"
                    : state === "limit" || state === "error"
                    ? "border-accent/40 text-accent"
                    : "border-ink text-ink hover:bg-ink hover:text-bone"
                }`}
              >
                {state === "loading" && "…"}
                {state === "idle" && "+ Pung"}
                {state === "added" && "I pungen"}
                {state === "exists" && "Allerede"}
                {state === "limit" && "Full"}
                {state === "error" && "Feilet"}
              </button>
            </div>
          );
        })}
      </div>
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
            const { sections, actions } = parseAnswer(turn.a);
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
                  {sections.map((s: Section, j: number) => (
                    <ModuleCard
                      key={`${i}-${j}-${s.key}`}
                      section={s}
                    />
                  ))}
                </div>
                {/* Proposed actions confirm card */}
                {actions.length > 0 && (
                  <ProposedActionsCard turnIndex={i} actions={actions} />
                )}
                {/* Mentioned products with link + add to bag */}
                {turn.mentionedProducts && turn.mentionedProducts.length > 0 && (
                  <MentionedProductsRow
                    products={turn.mentionedProducts}
                    locale={locale}
                  />
                )}
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
