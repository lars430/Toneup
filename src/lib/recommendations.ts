/**
 * Toneup Recommendation Engine — DIN egen logikk.
 *
 * Dette laget er motor-agnostisk: det konsumerer normalized
 * SkinAnalysisResult + brukerprofil + historikk, og produserer
 * Toneup-spesifikke anbefalinger.
 *
 * MVP: regelbasert. Fase 2: kan suppleres med LLM-resonnement.
 */

import type { SkinAnalysisResult } from "@/engine";
import type {
  UserProfile,
  UserProduct,
  SkinLog,
  SeasonalProfile,
  ProductCategory,
} from "@/types/domain";

export interface RecommendationContext {
  profile: UserProfile;
  latestAnalysis?: SkinAnalysisResult;
  recentLogs: SkinLog[];          // last 14–30 days
  productLog: UserProduct[];
  seasonalProfile?: SeasonalProfile;
  currentSeason: "spring" | "summer" | "autumn" | "winter";
}

export interface ToneupRecommendation {
  title: string;                  // i18n key, e.g. "rec.daily_pick.title"
  body: string;                   // i18n key
  category?: ProductCategory;
  productIds?: string[];
  reasoning: string[];            // i18n keys — transparent "why"
  confidence: number;             // 0..1
  priority: number;               // higher = show first
}

/**
 * Top-level entry: returns a ranked list of recommendations to show today.
 */
export function generateDailyRecommendations(
  ctx: RecommendationContext
): ToneupRecommendation[] {
  const recs: ToneupRecommendation[] = [];

  recs.push(...hydrationRules(ctx));
  recs.push(...seasonalRules(ctx));
  recs.push(...sensitivityRules(ctx));
  recs.push(...productPerformanceRules(ctx));

  return recs.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

// ============================================================
// RULE: Hydration
// ============================================================
function hydrationRules(ctx: RecommendationContext): ToneupRecommendation[] {
  const out: ToneupRecommendation[] = [];
  const hyd = ctx.latestAnalysis?.metrics.hydration ?? 0.5;

  const recentDryness =
    average(ctx.recentLogs.map((l) => l.dryness ?? 0)) / 5;

  if (hyd < 0.45 || recentDryness > 0.6) {
    out.push({
      title: "rec.hydration.title",
      body: "rec.hydration.body",
      category: "moisturizer",
      reasoning: [
        hyd < 0.45 ? "reason.analysis_low_hydration" : "reason.logged_dryness",
        ctx.currentSeason === "winter" ? "reason.cold_season" : "",
      ].filter(Boolean),
      confidence: 0.8,
      priority: 80,
    });
  }
  return out;
}

// ============================================================
// RULE: Seasonal pattern
// ============================================================
function seasonalRules(ctx: RecommendationContext): ToneupRecommendation[] {
  if (!ctx.seasonalProfile) return [];

  const out: ToneupRecommendation[] = [];

  // Resurface products that worked well this season in previous years
  const seasonalFavorites = ctx.productLog.filter(
    (p) =>
      p.usedInSeasons?.includes(ctx.currentSeason) &&
      p.worksWell === true &&
      p.status === "using"
  );

  if (seasonalFavorites.length > 0) {
    out.push({
      title: "rec.seasonal_return.title",
      body: "rec.seasonal_return.body",
      productIds: seasonalFavorites.slice(0, 3).map((p) => p.id),
      reasoning: ["reason.worked_last_year_same_season"],
      confidence: 0.75,
      priority: 70,
    });
  }
  return out;
}

// ============================================================
// RULE: Sensitivity flare
// ============================================================
function sensitivityRules(ctx: RecommendationContext): ToneupRecommendation[] {
  const out: ToneupRecommendation[] = [];
  const sens = ctx.latestAnalysis?.metrics.sensitivityIndicators ?? 0;
  const recentRedness = average(ctx.recentLogs.map((l) => l.redness ?? 0)) / 5;

  if (sens > 0.6 || recentRedness > 0.6) {
    out.push({
      title: "rec.sensitivity.title",
      body: "rec.sensitivity.body",
      reasoning: ["reason.elevated_sensitivity"],
      confidence: 0.85,
      priority: 90, // high priority — discomfort signals matter
    });
  }
  return out;
}

// ============================================================
// RULE: Detect products that don't work
// ============================================================
function productPerformanceRules(ctx: RecommendationContext): ToneupRecommendation[] {
  const out: ToneupRecommendation[] = [];

  // Has the user logged a reaction in the last 14 days?
  const recentReactions = ctx.recentLogs.filter(
    (l) => l.reactionToProductId
  );

  if (recentReactions.length >= 2) {
    const productId = recentReactions[0].reactionToProductId!;
    out.push({
      title: "rec.product_review.title",
      body: "rec.product_review.body",
      productIds: [productId],
      reasoning: ["reason.repeated_reactions_logged"],
      confidence: 0.7,
      priority: 60,
    });
  }
  return out;
}

// ============================================================
// SEASONAL PROFILE — derive from history
// ============================================================
/**
 * Compute a seasonal profile from a user's full history.
 * Runs on-demand or via a periodic job.
 */
export function deriveSeasonalProfile(
  season: "spring" | "summer" | "autumn" | "winter",
  year: number,
  logs: SkinLog[],
  products: UserProduct[]
): SeasonalProfile {
  const seasonLogs = logs.filter((l) => seasonOf(l.loggedAt) === season);
  const seasonProducts = products.filter((p) =>
    p.usedInSeasons?.includes(season)
  );

  const concerns: Record<string, number> = {};
  for (const log of seasonLogs) {
    if ((log.dryness ?? 0) >= 3) concerns.dryness = (concerns.dryness ?? 0) + 1;
    if ((log.redness ?? 0) >= 3) concerns.redness = (concerns.redness ?? 0) + 1;
    if ((log.breakouts ?? 0) >= 3) concerns.breakouts = (concerns.breakouts ?? 0) + 1;
    if ((log.oiliness ?? 0) >= 3) concerns.oiliness = (concerns.oiliness ?? 0) + 1;
  }

  const bestProducts = seasonProducts
    .filter((p) => p.worksWell === true)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5)
    .map((p) => p.id);

  return {
    season,
    year,
    insights: {
      bestProducts,
      dominantConcerns: Object.entries(concerns)
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k),
      sampleSize: seasonLogs.length,
    },
  };
}

// ---- helpers ----
function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function seasonOf(date: Date | string): "spring" | "summer" | "autumn" | "winter" {
  const d = typeof date === "string" ? new Date(date) : date;
  const m = d.getMonth(); // 0-11
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}
