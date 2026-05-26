import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

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

  // Cross-reference: last 14 skin logs
  const { data: recentLogs } = await supabase
    .from("skin_logs")
    .select("feel_label, dryness, redness, glow, sensitivity, breakouts, logged_at")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(14);

  // Bag products — look for items that may address detected concerns
  const { data: bagItems } = await supabase
    .from("makeup_bag_items")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .limit(30);

  // Profile for skin type context
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("skin_type, skin_goals, preferences")
    .eq("user_id", user.id)
    .single();

  const result = analysis.raw_result ?? {};
  const metrics = result.metrics ?? {};
  const concerns = result.concerns ?? [];
  const raw = result.raw ?? {};
  const undertone = raw.undertone ?? result.undertone ?? "neutral";
  const depth = raw.depth ?? result.depth ?? "medium";
  const correctedRgb = raw.correctedSkinRgb ?? result.correctedSkinRgb;
  const hexColor = correctedRgb ? rgbToHex(correctedRgb) : "#C8A882";

  const undertoneLabel: Record<string, string> = { warm: "Varm", cool: "Kjølig", neutral: "Nøytral" };
  const depthLabel: Record<string, string> = { fair: "Lys", light: "Lys-medium", medium: "Medium", tan: "Tan", deep: "Dyp" };

  // Derive log-based insights to cross-reference with analysis
  const logInsights = deriveLogInsights(recentLogs ?? [], concerns, profile?.skin_type);

  // Find relevant bag products based on concerns and undertone
  const relevantProducts = findRelevantProducts(bagItems ?? [], concerns, undertone, depth);
  const potentiallyProblematic = findProblematicProducts(bagItems ?? [], concerns, profile?.skin_type);

  // Foundation shade recommendation
  const shadeRecommendation = buildShadeAdvice(undertone, depth, profile?.skin_type);

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <div className="max-w-md mx-auto px-7 py-10">

        <header className="flex justify-between items-center mb-10">
          <Link href={`/${locale}/me/analyses`} className="text-[11px] uppercase tracking-[0.24em] text-soft-ink">
            ← Analyser
          </Link>
          <span className="text-[10px] uppercase tracking-[0.32em] text-mute">
            {formatDate(analysis.taken_at)}
          </span>
        </header>

        <div className="divider-line mb-10" />

        {/* Skin tone swatch */}
        <div className="flex items-end gap-6 mb-10">
          <div className="w-20 h-20 flex-shrink-0" style={{ backgroundColor: hexColor }} />
          <div>
            <h1 className="font-display text-3xl leading-tight tracking-wide2 mb-1">Din hudpalett</h1>
            <p className="font-display italic text-soft-ink text-base">
              {undertoneLabel[undertone] ?? undertone} undertone · {depthLabel[depth] ?? depth} dybde
            </p>
            <p className="font-display text-xs text-mute mt-1 uppercase tracking-[0.24em]">
              {hexColor}
            </p>
          </div>
        </div>

        {/* Undertone explanation */}
        <section className="mb-10 bg-cream px-5 py-5">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">Hva betyr dette?</div>
          <p className="font-display italic text-sm text-soft-ink leading-relaxed mb-3">
            {undertoneExplanation(undertone)}
          </p>
          <p className="font-display text-sm leading-relaxed text-soft-ink">
            {depthExplanation(depth)}
          </p>
        </section>

        {/* Foundation shade advice */}
        <section className="mb-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">Foundation-anbefaling</div>
          <div className="border border-stone/40 px-5 py-5 space-y-3">
            <p className="font-display text-base leading-relaxed">{shadeRecommendation.headline}</p>
            <p className="font-display italic text-sm text-soft-ink leading-relaxed">
              {shadeRecommendation.detail}
            </p>
            <div className="border-t border-stone/30 pt-3 mt-3">
              <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-1">Undertoner å se etter</div>
              <div className="font-display text-sm">{shadeRecommendation.keywords.join(" · ")}</div>
            </div>
          </div>
        </section>

        {/* Skin metrics */}
        {Object.keys(metrics).length > 0 && (
          <section className="mb-10">
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-5">Hudmålinger</div>
            <div className="space-y-5">
              {[
                { label: "Rødhet", value: metrics.redness, note: metrics.redness > 0.55 ? "Forhøyet — kan indikere sensitivitet" : null },
                { label: "Glød", value: metrics.radiance, note: metrics.radiance < 0.4 ? "Lavere enn normalt" : null },
                { label: "Jevnhet", value: metrics.evenness, note: null },
              ].filter((m) => m.value != null).map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-display text-sm">{m.label}</span>
                    <span className="text-[11px] text-mute">{Math.round(m.value * 100)}%</span>
                  </div>
                  <div className="h-px bg-stone/30">
                    <div className="h-px bg-ink transition-all" style={{ width: `${m.value * 100}%` }} />
                  </div>
                  {m.note && (
                    <p className="font-display italic text-[11px] text-mute mt-1">{m.note}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Concerns */}
        {concerns.length > 0 && (
          <section className="mb-10">
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-5">Vi merket</div>
            <div className="space-y-3">
              {concerns.map((c: { key: string; severity: number; confidence: number }) => (
                <div key={c.key} className="bg-cream px-5 py-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-display text-base">{concernLabel(c.key)}</div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-mute">
                      {Math.round(c.severity * 100)}%
                    </div>
                  </div>
                  <p className="font-display italic text-xs text-soft-ink leading-relaxed">
                    {concernAdvice(c.key, profile?.skin_type)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {concerns.length === 0 && (
          <section className="mb-10">
            <div className="bg-cream px-6 py-6 text-center">
              <div className="font-display text-lg mb-2">Ingen bekymringer funnet</div>
              <div className="font-display italic text-soft-ink text-sm">Huden din ser balansert ut.</div>
            </div>
          </section>
        )}

        {/* Cross-reference: log insights */}
        {logInsights.length > 0 && (
          <section className="mb-10">
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">Sammenheng med hudloggene dine</div>
            <div className="space-y-3">
              {logInsights.map((insight, i) => (
                <div key={i} className="border-l-2 border-ink/30 pl-4 py-1">
                  <p className="font-display italic text-sm text-soft-ink leading-relaxed">
                    — {insight}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Relevant bag products */}
        {relevantProducts.length > 0 && (
          <section className="mb-10">
            <div className="flex justify-between items-baseline mb-4">
              <div className="text-[10px] uppercase tracking-[0.4em] text-mute">Fra pungen din — kan hjelpe</div>
              <Link href={`/${locale}/bag`} className="text-[10px] uppercase tracking-[0.28em] text-soft-ink underline underline-offset-4">Se alt</Link>
            </div>
            <div className="space-y-2">
              {relevantProducts.slice(0, 4).map((item: any) => (
                <div key={item.id} className="bg-cream px-4 py-4 flex items-center gap-4">
                  {item.shade_code ? (
                    <div className="w-10 h-10 flex-shrink-0 rounded-sm" style={{ background: item.shade_code }} />
                  ) : (
                    <div className="w-10 h-10 flex-shrink-0 rounded-sm bg-stone/40" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base truncate">{item.products?.name}</div>
                    <div className="font-display italic text-xs text-soft-ink">
                      {item.products?.brand}{item.shade_name && ` · ${item.shade_name}`}
                    </div>
                  </div>
                  {item.loved && <span className="text-accent text-sm flex-shrink-0">♥</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Potentially problematic products */}
        {potentiallyProblematic.length > 0 && (
          <section className="mb-10">
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">Vær oppmerksom på</div>
            <div className="space-y-2">
              {potentiallyProblematic.slice(0, 3).map((item: any) => (
                <div key={item.id} className="border border-accent/30 px-4 py-4 flex items-center gap-4">
                  {item.shade_code ? (
                    <div className="w-8 h-8 flex-shrink-0 rounded-sm" style={{ background: item.shade_code }} />
                  ) : (
                    <div className="w-8 h-8 flex-shrink-0 rounded-sm bg-stone/40" />
                  )}
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

// ── Cross-feature intelligence ─────────────────────────────────────────────

function deriveLogInsights(
  logs: any[],
  concerns: any[],
  skinType?: string
): string[] {
  if (logs.length === 0) return [];
  const insights: string[] = [];

  const avg = (key: string) =>
    logs.reduce((s, l) => s + (l[key] ?? 3), 0) / logs.length;

  const avgRedness = avg("redness");
  const avgDryness = avg("dryness");
  const avgGlow    = avg("glow");
  const avgSens    = avg("sensitivity");

  const hasRednessConcern = concerns.some((c) => c.key === "redness");
  const hasDullnessConcern = concerns.some((c) => c.key === "dullness");

  if (hasRednessConcern && avgRedness >= 3.5)
    insights.push(`Analysen bekrefter det loggene dine viser: rødhet er et gjennomgående tema. ${avgRedness >= 4 ? "Det er markert forhøyet." : ""}`);

  if (hasRednessConcern && avgRedness < 2.5)
    insights.push("Analysen viser rødhet i bildet, men loggene dine rapporterer lite rødhet generelt — dette kan skyldes lysforhold under analysen.");

  if (hasDullnessConcern && avgGlow < 3)
    insights.push("Lav glød i analysen matcher loggene dine. Hydrering og søvn påvirker dette mest.");

  if (hasDullnessConcern && avgGlow >= 4)
    insights.push("Du logger god glød, men analysen ser en mattere overflate — dette kan skyldes sesong eller tidspunkt på dagen.");

  if (avgDryness <= 2 && skinType !== "oily")
    insights.push("Loggene dine viser vedvarende tørrhet. Dybdehydrering bør prioriteres i rutinen.");

  if (avgSens >= 4)
    insights.push("Du logger høy sensitivitet jevnlig. Unngå aktive ingredienser i perioder med mye rødhet eller stress.");

  return insights.slice(0, 3);
}

function findRelevantProducts(
  items: any[],
  concerns: any[],
  undertone: string,
  depth: string
): any[] {
  const concernKeys = concerns.map((c: any) => c.key);
  const relevant: any[] = [];

  for (const item of items) {
    const cat = item.products?.category?.toLowerCase() ?? "";
    const name = (item.products?.name ?? "").toLowerCase();

    // Skincare that addresses concerns
    if (concernKeys.includes("redness") && (cat === "skincare" || name.includes("calm") || name.includes("sensitiv") || name.includes("redness")))
      relevant.push(item);
    else if (concernKeys.includes("dullness") && (name.includes("glow") || name.includes("radianc") || name.includes("vitamin c") || name.includes("glød")))
      relevant.push(item);
    else if (concernKeys.includes("dehydration") && (name.includes("hydrat") || name.includes("moistur") || cat === "skincare"))
      relevant.push(item);
    // Foundation undertone match
    else if (cat === "foundation") {
      const shadeName = (item.shade_name ?? "").toLowerCase();
      if (undertone === "warm" && (shadeName.includes("warm") || shadeName.includes("golden") || shadeName.includes("beige") || shadeName.includes("doré")))
        relevant.push(item);
      else if (undertone === "cool" && (shadeName.includes("cool") || shadeName.includes("pink") || shadeName.includes("rosé") || shadeName.includes("porcelain")))
        relevant.push(item);
      else if (undertone === "neutral")
        relevant.push(item);
    }
  }

  // Deduplicate by id and prioritize loved items
  const seen = new Set<string>();
  return [...relevant]
    .filter((i) => { if (seen.has(i.id)) return false; seen.add(i.id); return true; })
    .sort((a, b) => (b.loved ? 1 : 0) - (a.loved ? 1 : 0));
}

function findProblematicProducts(
  items: any[],
  concerns: any[],
  skinType?: string
): any[] {
  const concernKeys = concerns.map((c: any) => c.key);
  const flagged: any[] = [];

  for (const item of items) {
    const cat = item.products?.category?.toLowerCase() ?? "";
    const name = (item.products?.name ?? "").toLowerCase();
    let reason: string | null = null;

    if (concernKeys.includes("redness") && skinType === "sensitive") {
      if (name.includes("exfoliat") || name.includes("acid") || name.includes("retinol") || name.includes("peeling"))
        reason = "Kan forsterke rødhet ved sensitiv hud";
    }
    if (concernKeys.includes("redness") && (name.includes("scrub") || name.includes("toner") && name.includes("acid")))
      reason = "Kan irritere hud med forhøyet rødhet";

    if (reason) flagged.push({ ...item, _reason: reason });
  }

  return flagged;
}

function buildShadeAdvice(undertone: string, depth: string, skinType?: string): {
  headline: string; detail: string; keywords: string[];
} {
  const undertoneAdvice: Record<string, { headline: string; detail: string; keywords: string[] }> = {
    warm: {
      headline: "Velg foundation med gylne og beige undertoner",
      detail: "Varme undertoner trives best med produkter som har golden, peach eller beige i fargebeskrivelsen. Unngå rosébaserte foundations som kan gjøre huden grå.",
      keywords: ["Golden", "Warm", "Beige", "Peach", "Doré", "Noisette"],
    },
    cool: {
      headline: "Velg foundation med roséhvite og kjølige undertoner",
      detail: "Kjølige undertoner matcher best med foundations som er beskrevet som pink, rosy eller porcelain. Gylne og orange-baserte nyanser kan gi en grønnlig kontrast.",
      keywords: ["Cool", "Pink", "Rosy", "Porcelain", "Rosé", "Ivory"],
    },
    neutral: {
      headline: "Du har nøytrale undertoner — fleksibel match",
      detail: "Nøytrale undertoner passer med de fleste foundations. Fokuser på dybde (lys, medium, dyp) fremfor undertone. Beige og nude nyanser fungerer særlig godt.",
      keywords: ["Neutral", "Nude", "Beige", "Natural", "Sand"],
    },
  };

  const base = undertoneAdvice[undertone] ?? undertoneAdvice.neutral;

  const depthNote =
    depth === "fair" ? " Med lys huddybde bør du teste nyansen i dagslys før du kjøper." :
    depth === "deep" ? " Med dyp huddybde er dekkende, pigmentrike formler som gir mest naturlig resultat." :
    "";

  return { ...base, detail: base.detail + depthNote };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function undertoneExplanation(undertone: string): string {
  const m: Record<string, string> = {
    warm: "Din hud har varme undertoner — gylne, peachy eller gulaktige nyanser under overflaten. Dette er vanlig ved oliven- og middelhavshud, og gir deg et naturlig varmt utseende.",
    cool: "Din hud har kjølige undertoner — rosa, røde eller blålige nyanser under overflaten. Dette er vanlig ved lys nordeuropeisk hud og gir et friskt, klart utseende.",
    neutral: "Din hud har nøytrale undertoner — en blanding av varme og kjølige toner. Dette er den mest fleksible hudtypen for sminke og foundation-matching.",
  };
  return m[undertone] ?? m.neutral;
}

function depthExplanation(depth: string): string {
  const m: Record<string, string> = {
    fair: "Huddybden din er klassifisert som lys. Lette, luftige formler med lav dekning ser som regel mest naturlig ut.",
    light: "Huddybden din er lys til medium — den vanligste kategorien i skandinavisk klima.",
    medium: "Medium huddybde gir deg mange foundation-alternativer og bred kompatibilitet med de fleste fargesystemer.",
    tan: "Tan huddybde trenger riktig pigmentering i foundation for å unngå for lys eller grå finish.",
    deep: "Dyp huddybde krever foundations med høy pigmentering. Unngå nyanser med gråstikk.",
  };
  return m[depth] ?? "";
}

function concernLabel(key: string): string {
  const labels: Record<string, string> = {
    redness: "Rødhet",
    uneven_tone: "Ujevn hudtone",
    dullness: "Matt hud",
    dehydration: "Dehydrering",
    breakout: "Uren hud",
  };
  return labels[key] ?? key;
}

function concernAdvice(key: string, skinType?: string): string {
  const m: Record<string, string> = {
    redness: skinType === "sensitive"
      ? "Sensitiv hud med rødhet bør prioritere parfymefrie, milde formler. Niacinamid og kamille er dokumentert beroligende."
      : "Rødhet kan dempes med niacinamid-serum, grønn primer eller grønnbeige concealer. Unngå varmt vann og kraftig eksfoliering.",
    uneven_tone: "Regelmessig bruk av vitamin C-serum (morgen) og AHA-eksfoliering (kveld, 2-3 ganger ukentlig) jevner ut hudtonen over tid.",
    dullness: "Matt hud responderer godt på hyaluronsyre, glyserin og lette olje-hybrider. Fuktighet er første prioritet.",
    dehydration: "Hydrering og fuktlåsing er ulikt — du trenger begge. Hyaluronsyre hydratiserer, ceramider og shea-butter låser fukt inne.",
    breakout: "Salicylsyre (BHA) er det beste OTC-alternativet for porene. Ren niacinamid reduserer sebumproduksjon og rødhet rundt urenheter.",
  };
  return m[key] ?? "Spør rådgiveren for tilpassede råd.";
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
