import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

export default async function SeasonPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("skin_type, skin_goals")
    .eq("user_id", user.id)
    .single();

  const season = computeSeason();
  const seasonMonths = SEASON_MONTHS[season];

  // Skin logs for current season (this year)
  const year = new Date().getFullYear();
  const { data: seasonLogs } = await supabase
    .from("skin_logs")
    .select("feel_label, dryness, redness, glow, sensitivity, breakouts, tags, logged_at")
    .eq("user_id", user.id)
    .gte("logged_at", `${year}-01-01`)
    .order("logged_at", { ascending: false });

  // Filter to current season months
  const currentSeasonLogs = (seasonLogs ?? []).filter((l: any) => {
    const m = new Date(l.logged_at).getMonth();
    return seasonMonths.includes(m);
  });

  // Last 30 days logs for "recent pattern"
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentLogs = (seasonLogs ?? []).filter(
    (l: any) => new Date(l.logged_at) >= thirtyDaysAgo
  );

  // Loved + seasonal bag items
  const { data: lovedItems } = await supabase
    .from("makeup_bag_items")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .eq("loved", true)
    .limit(6);

  // Season-tagged bag items
  const { data: seasonItems } = await supabase
    .from("makeup_bag_items")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .contains("occasions", [season])
    .limit(4);

  // Compute averages
  const avgMetrics = computeAvg(currentSeasonLogs);
  const recentAvg = computeAvg(recentLogs);
  const insights = deriveInsights(avgMetrics, recentAvg, profile?.skin_type, season);
  const dominantFeel = getDominantFeel(currentSeasonLogs);

  const logCount = currentSeasonLogs.length;
  const hasEnoughData = logCount >= 3;

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <div className="max-w-md mx-auto px-6 pt-10">

        {/* Header */}
        <header className="mb-9">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            Sesongprofil · {year}
          </div>
          <h1 className="font-display text-4xl leading-tight tracking-wide2 mb-2">
            {seasonName(season)}
          </h1>
          <p className="font-display italic text-soft-ink text-base mt-2 leading-relaxed">
            {seasonDescription(season, profile?.skin_type)}
          </p>
        </header>

        {/* Season metrics — only with enough data */}
        {hasEnoughData ? (
          <section className="mb-8">
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">
              Huden din denne sesongen
            </div>
            <div className="bg-cream px-5 py-5 space-y-4">
              {dominantFeel && (
                <div className="border-b border-stone/30 pb-4">
                  <div className="font-display text-sm text-soft-ink mb-1">
                    Vanligste hudfølelse
                  </div>
                  <div className="font-display text-2xl">{feelLabel(dominantFeel)}</div>
                </div>
              )}
              <MetricRow label="Fuktighet" value={avgMetrics.hydration} low="Tørr" high="Fuktig" />
              <MetricRow label="Rødhet" value={avgMetrics.redness} low="Ingen" high="Mye" invert />
              <MetricRow label="Glød" value={avgMetrics.glow} low="Matt" high="Strålende" />
              <MetricRow label="Sensitivitet" value={avgMetrics.sensitivity} low="Rolig" high="Reaktiv" invert />

              <div className="pt-2 border-t border-stone/30">
                <div className="font-display italic text-xs text-mute">
                  Basert på {logCount} hudlogger denne sesongen
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="mb-8">
            <div className="bg-cream px-5 py-5 text-center">
              <div className="font-display text-base mb-2">
                Logger mer, lær mer
              </div>
              <p className="font-display italic text-sm text-soft-ink mb-5 leading-relaxed">
                Logg huden 3 ganger denne sesongen for å se dine sesongmønstre.
                {logCount > 0 && ` Du har ${logCount} logg${logCount !== 1 ? "er" : ""} så langt.`}
              </p>
              <Link
                href={`/${locale}/skin-log`}
                className="inline-block bg-ink text-bone px-6 py-3 text-[11px] uppercase tracking-[0.32em]"
              >
                Logg huden nå
              </Link>
            </div>
          </section>
        )}

        {/* Seasonal insights */}
        {insights.length > 0 && (
          <section className="mb-8">
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">
              Sesongmønstre
            </div>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className="border border-stone/40 px-5 py-4">
                  <p className="font-display italic text-base leading-relaxed">
                    — {insight}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Products that work this season */}
        {((seasonItems && seasonItems.length > 0) ||
          (lovedItems && lovedItems.length > 0)) && (
          <section className="mb-8">
            <div className="flex justify-between items-baseline mb-4">
              <div className="text-[10px] uppercase tracking-[0.4em] text-mute">
                Fungerer best for deg nå
              </div>
              <Link
                href={`/${locale}/bag`}
                className="text-[10px] uppercase tracking-[0.28em] text-soft-ink underline underline-offset-4"
              >
                Se alt
              </Link>
            </div>
            <div className="space-y-2">
              {(seasonItems?.length ? seasonItems : lovedItems ?? [])
                .slice(0, 4)
                .map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-cream px-4 py-4 flex items-center gap-4"
                  >
                    {item.shade_code ? (
                      <div
                        className="w-10 h-10 flex-shrink-0 rounded-sm"
                        style={{ background: item.shade_code }}
                      />
                    ) : (
                      <div className="w-10 h-10 flex-shrink-0 rounded-sm bg-stone/40" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-base truncate">
                        {item.products?.name}
                      </div>
                      <div className="font-display italic text-xs text-soft-ink">
                        {item.products?.brand}
                        {item.shade_name && ` · ${item.shade_name}`}
                      </div>
                    </div>
                    {item.loved && (
                      <span className="text-accent text-sm flex-shrink-0">♥</span>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Season editorial */}
        <section className="mb-8 border-t border-stone/30 pt-8">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">
            Om denne sesongen
          </div>
          <div className="space-y-3">
            {seasonAdvice(season, profile?.skin_type).map((tip, i) => (
              <p key={i} className="font-display text-base leading-relaxed text-soft-ink">
                {tip}
              </p>
            ))}
          </div>
        </section>

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link
            href={`/${locale}/skin-log`}
            className="border border-stone/40 px-5 py-4 text-center hover:border-ink transition-colors"
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-mute mb-1">
              I dag
            </div>
            <div className="font-display text-base">Logg huden</div>
          </Link>
          <Link
            href={`/${locale}/ask`}
            className="border border-stone/40 px-5 py-4 text-center hover:border-ink transition-colors"
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-mute mb-1">
              Rådgiveren
            </div>
            <div className="font-display text-base">Spør om sesong</div>
          </Link>
        </div>
      </div>

      <BottomNav locale={locale} />
    </main>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MetricRow({
  label,
  value,
  low,
  high,
  invert = false,
}: {
  label: string;
  value: number;
  low: string;
  high: string;
  invert?: boolean;
}) {
  if (value === 0) return null;
  // Normalize 1-5 to 0-100%
  const pct = ((value - 1) / 4) * 100;
  // For "invert" metrics (redness, sensitivity), high is bad → use accent color
  const barColor = invert && value >= 3.5 ? "bg-accent/70" : "bg-ink";
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-display text-sm">{label}</span>
        <span className="font-display italic text-xs text-soft-ink">
          {value.toFixed(1)}/5
        </span>
      </div>
      <div className="h-1 bg-stone/30 rounded-full">
        <div
          className={`h-1 rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-mute">{low}</span>
        <span className="text-[9px] text-mute">{high}</span>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

const SEASON_MONTHS: Record<string, number[]> = {
  spring: [2, 3, 4],
  summer: [5, 6, 7],
  autumn: [8, 9, 10],
  winter: [11, 0, 1],
};

function computeSeason(): "spring" | "summer" | "autumn" | "winter" {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

function seasonName(s: string): string {
  return { spring: "Vår", summer: "Sommer", autumn: "Høst", winter: "Vinter" }[s] ?? s;
}

function seasonDescription(season: string, _skinType?: string): string {
  const base: Record<string, string> = {
    spring: "Sesongskiftet fra vinter til vår er en av de mest krevende overgangene for huden.",
    summer: "Varme, sol og økt fuktighet i luften forandrer hudens behov radikalt.",
    autumn: "Reparasjonstiden er her. Huden trenger gjenoppbygging etter sommeren.",
    winter: "Kald luft ute og tørr luft inne — huden trenger rikhet og beskyttelse.",
  };
  return base[season] ?? "";
}

function computeAvg(logs: any[]): Record<string, number> {
  if (!logs.length)
    return { dryness: 0, redness: 0, glow: 0, sensitivity: 0, breakouts: 0 };
  const keys = ["dryness", "redness", "glow", "sensitivity", "breakouts"];
  const result: Record<string, number> = {};
  for (const k of keys) {
    result[k] =
      logs.reduce((s, l) => s + (l[k] ?? 3), 0) / logs.length;
  }
  return result;
}

function getDominantFeel(logs: any[]): string | null {
  if (!logs.length) return null;
  const counts: Record<string, number> = {};
  for (const l of logs) {
    if (l.feel_label) counts[l.feel_label] = (counts[l.feel_label] ?? 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

function deriveInsights(
  avg: Record<string, number>,
  recent: Record<string, number>,
  skinType?: string,
  season?: string
): string[] {
  const insights: string[] = [];
  if (!avg.dryness) return insights;

  if (avg.dryness <= 2)
    insights.push("Huden din er gjennomgående tørrere denne sesongen enn ved normalt tilfelle.");
  if (avg.redness >= 3.5)
    insights.push("Rødhet er forhøyet denne sesongen — aktive ingredienser bør brukes varsomt.");
  if (avg.glow >= 4)
    insights.push("Huden din stråler spesielt godt i denne sesongen.");
  if (avg.sensitivity >= 4)
    insights.push("Sensitiv periode — huden reagerer mer enn vanlig. Velg milde formler.");

  if (recent.hydration && avg.dryness && recent.hydration < avg.dryness - 0.5)
    insights.push("Huden virker tørrere nå enn tidligere denne sesongen.");
  if (recent.glow && avg.glow && recent.glow > avg.glow + 0.5)
    insights.push("Huden din stråler mer nå enn resten av sesongen — noe virker.");

  if (season === "spring" && skinType === "dry")
    insights.push("Tørr hud stramner ofte til i overgangen fra vinter til vår. Fortsett med rike formler litt til.");
  if (season === "summer")
    insights.push("Lette, vandig-baserte produkter gir best resultater i varme måneder.");

  return insights.slice(0, 4);
}

function seasonAdvice(season: string, _skinType?: string): string[] {
  const base: Record<string, string[]> = {
    spring: [
      "Bytt gradvis fra tunge vinterprodukter til lettere formler — plutselig bytte kan forstyrre hudbarrieren.",
      "SPF blir viktigere nå. Dagslyset er sterkere selv om temperaturen ikke er det.",
      "Vårens svingninger i temperatur og luftfuktighet gjør huden uforutsigbar. Logg jevnlig.",
    ],
    summer: [
      "Lettere base og mattere finish gir bedre resultater når temperaturen stiger.",
      "Hydrering er kritisk om sommeren — ikke glem å drikke vann, ikke bare bruk fuktighetsprodukt.",
      "Solbeskyttelse er den viktigste anti-aging-investeringen i denne sesongen.",
    ],
    autumn: [
      "Høsten er den beste sesongen for aktive ingredienser som retinol og AHA — mindre sol betyr lavere risiko.",
      "Gjenoppbygg hudbarrieren gradvis. Keramider og peptider er gode hjelpere nå.",
      "Fuktigheten i luften synker. Fuktighetsgivende serumer bør tilbake i rutinen.",
    ],
    winter: [
      "Tykke, rike kremer med ceramider og fettsyrer er vinterens viktigste allierte.",
      "Unngå for varmt vann i ansiktet — det fjerner de naturlige oljene huden trenger.",
      "Inneluften er tørr. En luftfukter på soverommet gjør mer for huden enn mange produkter.",
    ],
  };
  return base[season] ?? [];
}

function feelLabel(key: string): string {
  const m: Record<string, string> = {
    radiant: "Strålende", balanced: "Balansert", tired: "Trett",
    tight: "Stram", reactive: "Reaktiv", oily: "Glinsende",
  };
  return m[key] ?? key;
}
