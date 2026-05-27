import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

type ScoreKey = "redness" | "glow" | "evenness" | "dryness";
type ConfidenceLevel = "high" | "medium" | "medium-low" | "low";

export default async function AnalysisResultPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: analysis } = await supabase
    .from("skin_analyses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!analysis) redirect(`/${locale}/home`);

  const { data: recentLogs } = await supabase
    .from("skin_logs")
    .select("feel_label, dryness, redness, glow, sensitivity, breakouts, logged_at")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(14);

  const { data: bagItems } = await supabase
    .from("makeup_bag_items")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .limit(30);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("skin_type, skin_goals, preferences")
    .eq("user_id", user.id)
    .single();

  const result = analysis.raw_result ?? {};
  const raw = result.raw ?? {};
  const undertone = raw.undertone ?? result.undertone ?? "neutral";
  const depth = raw.depth ?? result.depth ?? "medium";
  const correctedRgb = raw.correctedSkinRgb ?? result.correctedSkinRgb;
  const hexColor = correctedRgb ? rgbToHex(correctedRgb) : "#C8A882";

  // New schema fields (fall back gracefully if missing on older analyses)
  const scores: Record<ScoreKey, number> = result.scores ?? {
    redness: Math.round((result.metrics?.redness ?? 0) * 100),
    glow: Math.round((result.metrics?.radiance ?? 0) * 100),
    evenness: Math.round((result.metrics?.evenness ?? 0) * 100),
    dryness: 0,
  };

  const confidence: Record<string, ConfidenceLevel> = result.confidence ?? {
    overall: "medium",
    redness: "medium",
    undertone: "medium",
    dryness: "low",
    evenness: "medium",
  };

  const lighting = result.lightingQuality ?? null;
  const observations: string[] = result.observations ?? [];
  const interpretations: string[] = result.interpretations ?? [];
  const recommendations: string[] = result.recommendations ?? [];
  const primaryConcern: string | null = result.primaryConcern ?? null;
  const scoreRationale: Record<string, string> = result.scoreRationale ?? {};

  // Log-based dryness signal — separate from image
  const logDryness = deriveLogDryness(recentLogs ?? []);

  // Bag products that may help
  const relevantProducts = findRelevantProducts(bagItems ?? [], result, undertone);
  const potentiallyProblematic = findProblematicProducts(bagItems ?? [], result, profile?.skin_type);

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <div className="max-w-md mx-auto px-7 py-10">

        <header className="flex justify-between items-center mb-10">
          <Link
            href={`/${locale}/me/analyses`}
            className="text-[11px] uppercase tracking-[0.24em] text-soft-ink"
          >
            ← Analyser
          </Link>
          <span className="text-[10px] uppercase tracking-[0.32em] text-mute">
            {formatDate(analysis.taken_at)}
          </span>
        </header>

        <div className="divider-line mb-10" />

        {/* Skin tone swatch */}
        <div className="flex items-end gap-6 mb-8">
          <div className="w-20 h-20 flex-shrink-0" style={{ backgroundColor: hexColor }} />
          <div>
            <h1 className="font-display text-3xl leading-tight tracking-wide2 mb-1">
              Din hudpalett
            </h1>
            <p className="font-display italic text-soft-ink text-base">
              {undertoneLabel(undertone)} undertone · {depthLabel(depth)} dybde
            </p>
            <p className="font-display text-xs text-mute mt-1 uppercase tracking-[0.24em]">
              {hexColor}
            </p>
          </div>
        </div>

        {/* Overall confidence indicator */}
        {confidence.overall && (
          <section className="mb-8 bg-cream px-5 py-3 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.32em] text-mute">
              Analyse-tillit
            </div>
            <div className="font-display text-sm text-soft-ink">
              {confidenceLabel(confidence.overall)}
            </div>
          </section>
        )}

        {/* Primary concern headline */}
        {primaryConcern && primaryConcern !== "balanced" && (
          <section className="mb-8 bg-ink text-bone px-5 py-5">
            <div className="text-[10px] uppercase tracking-[0.4em] text-bone/50 mb-2">
              Mest fremtredende nå
            </div>
            <div className="font-display text-2xl leading-snug">
              {concernHeadline(primaryConcern)}
            </div>
          </section>
        )}

        {/* Observations */}
        {observations.length > 0 && (
          <Section eyebrow="Hva bildet viser" tone="cream">
            <ul className="space-y-2">
              {observations.map((o, i) => (
                <li key={i} className="font-display text-sm text-soft-ink leading-relaxed">
                  · {o}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Scores — qualitative, bar in background */}
        <section className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-5">
            Prioriteringssignaler
          </div>
          <div className="space-y-4">
            <ScoreRow
              label="Rødhet"
              level={qualitative(scores.redness)}
              score={scores.redness}
              confidence={confidence.redness}
              rationale={scoreRationale.redness}
              direction="high-bad"
            />
            <ScoreRow
              label="Glød"
              level={qualitative(scores.glow)}
              score={scores.glow}
              confidence={confidence.overall}
              rationale={scoreRationale.glow}
              direction="high-good"
            />
            <ScoreRow
              label="Jevn hudtone"
              level={qualitative(scores.evenness)}
              score={scores.evenness}
              confidence={confidence.evenness}
              rationale={scoreRationale.evenness}
              direction="high-good"
            />
            <ScoreRow
              label="Tørrhet"
              level={logDryness ? "Loggbasert" : "Ikke målt fra bilde"}
              score={logDryness ?? 0}
              confidence={logDryness ? "medium" : "low"}
              rationale={
                logDryness
                  ? `Basert på siste 14 hudlogger — ikke fra dette bildet`
                  : scoreRationale.dryness
              }
              direction="high-bad"
              muted={!logDryness}
            />
          </div>
          <p className="text-[10px] tracking-wider text-mute mt-4 leading-relaxed">
            Tallene er relative prioriteringssignaler, ikke kliniske målinger.
          </p>
        </section>

        {/* Lighting note */}
        {lighting && lighting.notes && lighting.notes.length > 0 && (
          <section className="mb-8 border-l-2 border-mute/40 pl-5 py-1">
            <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-2">
              Om lyset i bildet
            </div>
            <ul className="space-y-1">
              {lighting.notes.map((n: string, i: number) => (
                <li key={i} className="font-display italic text-sm text-soft-ink leading-relaxed">
                  {n}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Interpretations */}
        {interpretations.length > 0 && (
          <Section eyebrow="Hva det kan tyde på" tone="border">
            <ul className="space-y-2">
              {interpretations.map((i, idx) => (
                <li key={idx} className="font-display italic text-sm text-soft-ink leading-relaxed">
                  — {i}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Section eyebrow="Prioriter nå" tone="cream">
            <ul className="space-y-2">
              {recommendations.map((r, i) => (
                <li key={i} className="font-display text-sm text-ink leading-relaxed">
                  · {r}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Relevant bag products */}
        {relevantProducts.length > 0 && (
          <section className="mb-8">
            <div className="flex justify-between items-baseline mb-4">
              <div className="text-[10px] uppercase tracking-[0.4em] text-mute">Fra pungen — kan hjelpe</div>
              <Link href={`/${locale}/bag`} className="text-[10px] uppercase tracking-[0.28em] text-soft-ink underline underline-offset-4">Se alt</Link>
            </div>
            <div className="space-y-2">
              {relevantProducts.slice(0, 4).map((item: any) => (
                <Link
                  key={item.id}
                  href={item.products?.id ? `/${locale}/products/${item.products.id}` : `/${locale}/bag`}
                  className="block bg-cream px-4 py-4 hover:bg-stone/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 flex-shrink-0 rounded-sm border border-stone/30"
                      style={{ background: item.shade_code ?? item.products?.attributes?.hex ?? "#D9CFC1" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-base truncate">{item.products?.name}</div>
                      <div className="font-display italic text-xs text-soft-ink">
                        {item.products?.brand}
                        {item.shade_name && ` · ${item.shade_name}`}
                      </div>
                    </div>
                    {item.loved && <span className="text-accent text-sm flex-shrink-0">♥</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Potentially problematic products */}
        {potentiallyProblematic.length > 0 && (
          <section className="mb-8">
            <div className="text-[10px] uppercase tracking-[0.4em] text-accent mb-4">Vær oppmerksom på</div>
            <div className="space-y-2">
              {potentiallyProblematic.slice(0, 3).map((item: any) => (
                <div key={item.id} className="border border-accent/30 px-4 py-4 flex items-center gap-4">
                  <div
                    className="w-8 h-8 flex-shrink-0 rounded-sm"
                    style={{ background: item.shade_code ?? item.products?.attributes?.hex ?? "#D9CFC1" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-sm truncate">{item.products?.name}</div>
                    <div className="font-display italic text-xs text-mute">{item._reason}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="font-display italic text-xs text-mute mt-3 leading-relaxed">
              Spør rådgiveren for å gå dypere inn i produktene dine.
            </p>
          </section>
        )}

        <div className="space-y-3 mt-4">
          <Link href={`/${locale}/ask`}
            className="block w-full bg-ink text-bone py-5 text-center text-[11px] uppercase tracking-[0.32em]">
            Spør rådgiveren om resultatet
          </Link>
          <Link href={`/${locale}/analyze/calibrate`}
            className="block w-full border border-stone/40 text-soft-ink py-4 text-center text-[11px] uppercase tracking-[0.32em]">
            Ta ny analyse
          </Link>
          <Link href={`/${locale}/home`}
            className="block w-full text-soft-ink py-3 text-center text-[11px] uppercase tracking-[0.24em]">
            Til forsiden
          </Link>
        </div>

        <p className="text-[10px] tracking-wider text-mute text-center mt-12 leading-relaxed">
          Analysen er kosmetisk veiledning, ikke medisinsk diagnose.
        </p>
      </div>

      <BottomNav locale={locale} />
    </main>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Section({
  eyebrow,
  children,
  tone,
}: {
  eyebrow: string;
  children: React.ReactNode;
  tone: "cream" | "border";
}) {
  return (
    <section
      className={`mb-7 ${
        tone === "cream" ? "bg-cream px-5 py-5" : "border border-stone/40 px-5 py-5"
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-3">
        {eyebrow}
      </div>
      {children}
    </section>
  );
}

function ScoreRow({
  label,
  level,
  score,
  confidence,
  rationale,
  direction,
  muted = false,
}: {
  label: string;
  level: string;
  score: number;
  confidence: ConfidenceLevel;
  rationale?: string;
  direction: "high-bad" | "high-good";
  muted?: boolean;
}) {
  const barTone = muted
    ? "bg-stone/40"
    : direction === "high-bad"
    ? score >= 60
      ? "bg-accent"
      : "bg-ink/70"
    : score >= 60
    ? "bg-ink/70"
    : "bg-accent";

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className={`font-display text-sm ${muted ? "text-mute" : ""}`}>{label}</span>
        <span className={`text-[11px] tracking-wider ${muted ? "text-mute" : "text-soft-ink"}`}>
          {level}
          {!muted && confidence && (
            <span className="ml-2 text-mute">· {confidenceLabel(confidence).toLowerCase()}</span>
          )}
        </span>
      </div>
      <div className="h-px bg-stone/30 relative">
        <div
          className={`absolute top-0 left-0 h-px transition-all ${barTone}`}
          style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
        />
      </div>
      {rationale && (
        <p className="font-display italic text-[11px] text-mute mt-1.5 leading-relaxed">
          {rationale}
        </p>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function qualitative(score: number): string {
  if (score >= 75) return "Høy";
  if (score >= 55) return "Forhøyet";
  if (score >= 35) return "Moderat";
  if (score >= 15) return "Lav";
  return "Veldig lav";
}

function confidenceLabel(c: ConfidenceLevel): string {
  return ({
    high: "Høy",
    medium: "Middels",
    "medium-low": "Middels-lav",
    low: "Lav",
  } as Record<string, string>)[c] ?? c;
}

function undertoneLabel(u: string): string {
  return ({
    warm: "Varm",
    cool: "Kjølig",
    neutral: "Nøytral",
    olive: "Oliven",
    "likely-warm-neutral": "Varm-nøytral (usikker)",
    uncertain: "Usikker",
  } as Record<string, string>)[u] ?? u;
}

function depthLabel(d: string): string {
  return ({
    fair: "Lys",
    light: "Lys-medium",
    medium: "Medium",
    tan: "Tan",
    deep: "Dyp",
  } as Record<string, string>)[d] ?? d;
}

function concernHeadline(key: string): string {
  return ({
    redness_sensitivity: "Sensitivitet og rødhet",
    central_redness: "Sentral rødhet",
    redness: "Forhøyet rødhet",
    dullness: "Matt hud, lav glød",
    uneven_tone: "Ujevn hudtone",
    dehydration: "Dehydrert hud",
    breakout: "Urenheter",
    balanced: "Balansert",
  } as Record<string, string>)[key] ?? key;
}

function deriveLogDryness(logs: any[]): number | null {
  if (!logs?.length) return null;
  const avg = logs.reduce((s, l) => s + (l.dryness ?? 3), 0) / logs.length;
  // Convert 1-5 scale to 0-100. Lower dryness value = drier skin in our schema.
  // dryness=1 → very dry → score 100. dryness=5 → well hydrated → score 0.
  return Math.round((5 - avg) * 25);
}

function findRelevantProducts(items: any[], result: any, undertone: string): any[] {
  const concernKeys: string[] = (result.concerns ?? []).map((c: any) => c.key);
  const out: any[] = [];
  for (const item of items) {
    const name = (item.products?.name ?? "").toLowerCase();
    const cat = (item.products?.category ?? "").toLowerCase();
    if (concernKeys.some((k) => k.includes("redness")) && /calm|cica|sensitiv|niacinamid|centella|panthenol/.test(name)) {
      out.push(item);
    } else if (concernKeys.includes("dullness") && /glow|radian|vitamin c|brighten/.test(name)) {
      out.push(item);
    } else if (cat === "foundation") {
      const shadeName = (item.shade_name ?? "").toLowerCase();
      if (undertone === "warm" && /warm|golden|beige|doré/.test(shadeName)) out.push(item);
      else if (undertone === "cool" && /cool|pink|rose|porcelain/.test(shadeName)) out.push(item);
      else if (undertone === "neutral") out.push(item);
    }
  }
  const seen = new Set<string>();
  return out
    .filter((i) => { if (seen.has(i.id)) return false; seen.add(i.id); return true; })
    .sort((a, b) => (b.loved ? 1 : 0) - (a.loved ? 1 : 0));
}

function findProblematicProducts(items: any[], result: any, skinType?: string): any[] {
  const concernKeys: string[] = (result.concerns ?? []).map((c: any) => c.key);
  const flagged: any[] = [];
  for (const item of items) {
    const name = (item.products?.name ?? "").toLowerCase();
    let reason: string | null = null;
    if (concernKeys.some((k) => k.includes("redness"))) {
      if (/retinol|aha|bha|glycolic|salicylic|scrub|peeling/.test(name)) {
        reason = "Aktive ingredienser — pause ved forhøyet rødhet";
      }
    }
    if (!reason && skinType === "sensitive" && /exfoliat|retinol|acid/.test(name)) {
      reason = "Sterk for sensitiv hud — bruk varsomt";
    }
    if (reason) flagged.push({ ...item, _reason: reason });
  }
  return flagged;
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("nb-NO", {
    day: "numeric", month: "long", year: "numeric",
  });
}
