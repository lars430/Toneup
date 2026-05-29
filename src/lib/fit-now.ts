/**
 * Toneup — "Passer nå" engine
 *
 * Lightweight scoring shared by Home, Bag and Shade Match. Given today's
 * skin signal (last analysis + recent logs + profile), score how well a
 * given product fits the user *right now*.
 *
 * Output is intentionally compact: a verdict, a short reason and a numeric
 * score. The UI decides how to render it.
 */

export type FitVerdict = "great" | "good" | "neutral" | "watch";

export interface FitSignal {
  undertone?: "warm" | "cool" | "neutral" | string | null;
  depth?: "fair" | "light" | "medium" | "tan" | "deep" | string | null;
  /** Granular depth from skin profile (fair_light, light, …) */
  skinDepth?: string | null;
  recommendedDepthRange?: string[];
  avoidFoundationDepths?: string[];
  avoidUndertones?: string[];
  rednessLevel?: string | null;
  correctedSkinHex?: string | null;
  /** 0..5, avg of last 7 logs */
  avgRedness?: number;
  avgDryness?: number;
  avgGlow?: number;
  avgSensitivity?: number;
  skinType?: string | null;
  concerns?: string[];
  season?: "spring" | "summer" | "autumn" | "winter";
}

export interface BagItemLike {
  id: string;
  category?: string | null;
  shade_name?: string | null;
  shade_code?: string | null;
  loved?: boolean | null;
  products?: {
    name?: string | null;
    brand?: string | null;
    category?: string | null;
    attributes?: any;
  } | null;
}

export interface FitResult {
  verdict: FitVerdict;
  reason: string | null;
  score: number; // -100 .. 100
}

/**
 * Score a bag item against today's signal.
 * - Foundations use undertone/depth attributes (with shade_name as fallback).
 * - Skincare uses product name keywords against concerns and log averages.
 */
export function scoreBagItem(item: BagItemLike, sig: FitSignal): FitResult {
  const cat = (item.category ?? item.products?.category ?? "").toLowerCase();
  const name = (item.products?.name ?? "").toLowerCase();
  const shadeName = (item.shade_name ?? "").toLowerCase();
  const attr = item.products?.attributes ?? {};

  if (cat === "foundation") return scoreFoundation(attr, shadeName, sig);
  return scoreSkincare(name, cat, attr, sig);
}

function scoreFoundation(
  attr: any,
  shadeName: string,
  sig: FitSignal
): FitResult {
  const attrUndertone = (attr.undertone ?? "").toLowerCase();
  const attrDepth = (attr.depth ?? "").toLowerCase();

  // Derive from shade name when attributes are missing
  const nameUndertone =
    shadeName.match(/(warm|golden|doré|beige|peach|honey)/) ? "warm" :
    shadeName.match(/(cool|pink|rose|rosé|porcelain|ivory)/) ? "cool" :
    shadeName.match(/(neutral|natural|nude|sand)/) ? "neutral" :
    "";

  const undertone = attrUndertone || nameUndertone;
  let score = 0;
  let reason: string | null = null;

  if (sig.undertone && undertone) {
    if (undertone === sig.undertone) {
      score += 60;
      reason = "Matcher undertonen din";
    } else if (undertone === "neutral" || sig.undertone === "neutral") {
      score += 25;
      reason = "Nær undertonen din";
    } else {
      score -= 40;
      reason = `${capitalize(undertone)} undertone — kan kollidere med din`;
    }
  }

  if (sig.depth && attrDepth) {
    const d1 = depthRank(sig.depth);
    const d2 = depthRank(attrDepth);
    const diff = Math.abs(d1 - d2);
    if (diff === 0) score += 25;
    else if (diff === 1) score += 5;
    else score -= 20;
  }

  // Glow vs matte preference from logs
  if (sig.avgGlow != null) {
    const wantsGlow = sig.avgGlow < 3;
    const isMatte = /matte|velvet|powder|matt/.test(shadeName) || attr.finish === "matte";
    const isGlow = /glow|luminous|radiant|dewy|skin/.test(shadeName) || attr.finish === "dewy" || attr.finish === "luminous";
    if (wantsGlow && isMatte) {
      score -= 10;
      if (!reason) reason = "Matt finish — huden virker mattere nå";
    }
    if (wantsGlow && isGlow) score += 10;
  }

  return verdictFromScore(score, reason);
}

function scoreSkincare(
  name: string,
  cat: string,
  attr: any,
  sig: FitSignal
): FitResult {
  let score = 0;
  let reason: string | null = null;
  const concerns = sig.concerns ?? [];

  // High redness / sensitivity → flag actives
  const isActive = /retinol|aha|bha|glycolic|salicylic|acid|peeling|exfoliat|scrub/.test(name);
  const isCalm = /calm|cica|niacinamid|centella|sensitiv|allantoin|panthenol|rosehip/.test(name);
  const isHydrate = /hydrat|moistur|hyaluron|aqua|fukt|hydra|squalane|ceramide/.test(name);
  const isGlow = /glow|vitamin c|brighten|radiance|c\s|c-firma|illumin/.test(name);
  const isSpf = cat === "spf" || cat === "sunscreen" || /spf/.test(name);
  const isFragranceFree = attr?.fragrance_free === true;

  const wantsCalm =
    (sig.avgRedness ?? 0) >= 3.5 ||
    (sig.avgSensitivity ?? 0) >= 3.5 ||
    concerns.includes("redness") ||
    sig.skinType === "sensitive";

  const wantsHydrate =
    (sig.avgDryness ?? 5) <= 2 ||
    concerns.includes("dehydration") ||
    sig.skinType === "dry";

  const wantsGlow =
    (sig.avgGlow ?? 5) < 3 ||
    concerns.includes("dullness");

  if (wantsCalm && isActive) {
    score -= 50;
    reason = "Aktive ingredienser — pause ved forhøyet rødhet";
  } else if (wantsCalm && isCalm) {
    score += 40;
    reason = "Beroligende — bra ved sensitivitet nå";
  } else if (wantsHydrate && isHydrate) {
    score += 35;
    reason = "Fukt — huden ber om det nå";
  } else if (wantsGlow && isGlow) {
    score += 30;
    reason = "Glød — adresserer matt hud nå";
  } else if (isSpf && (sig.season === "spring" || sig.season === "summer")) {
    score += 25;
    reason = "SPF — daglig nå";
  } else if (isFragranceFree && sig.skinType === "sensitive") {
    score += 10;
    reason = "Parfymefritt — trygt valg";
  }

  return verdictFromScore(score, reason);
}

function verdictFromScore(score: number, reason: string | null): FitResult {
  let verdict: FitVerdict;
  if (score >= 60) verdict = "great";
  else if (score >= 20) verdict = "good";
  else if (score <= -30) verdict = "watch";
  else verdict = "neutral";
  return { verdict, reason, score };
}

function depthRank(d: string): number {
  return { fair: 0, light: 1, medium: 2, tan: 3, deep: 4 }[d as "fair"] ?? 2;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ────────────────────────────────────────────────────────────────────
// Helpers used by all consuming pages
// ────────────────────────────────────────────────────────────────────

export function buildSignal(
  lastAnalysis: any,
  recentLogs: any[],
  profile: any,
  season: "spring" | "summer" | "autumn" | "winter"
): FitSignal {
  const raw = lastAnalysis?.raw_result ?? lastAnalysis ?? {};
  const inner = raw?.raw ?? raw;
  const skinProfile = inner?.skinProfile ?? null;
  const undertone =
    skinProfile?.legacy_undertone ??
    inner?.undertone ??
    raw?.undertone ??
    null;
  const depth =
    skinProfile?.legacy_depth ?? inner?.depth ?? raw?.depth ?? null;
  const skinDepth = skinProfile?.skin_depth ?? inner?.skin_depth ?? null;
  const corrected = inner?.correctedSkinRgb as [number, number, number] | undefined;
  const correctedSkinHex = corrected
    ? `#${corrected.map((n) => Math.round(n).toString(16).padStart(2, "0")).join("")}`
    : null;
  const concerns = (raw?.concerns ?? []).map((c: any) => c.key);

  const avg = (key: string) =>
    recentLogs.length
      ? recentLogs.slice(0, 7).reduce((s, l) => s + (l[key] ?? 3), 0) /
        Math.min(7, recentLogs.length)
      : undefined;

  return {
    undertone,
    depth,
    skinDepth,
    recommendedDepthRange: skinProfile?.recommended_foundation_depth_range,
    avoidFoundationDepths: skinProfile?.avoid_foundation_depths,
    avoidUndertones: skinProfile?.avoid_undertones,
    rednessLevel: skinProfile?.redness_level ?? inner?.redness_level,
    correctedSkinHex,
    concerns,
    avgRedness: avg("redness"),
    avgDryness: avg("dryness"),
    avgGlow: avg("glow"),
    avgSensitivity: avg("sensitivity"),
    skinType: profile?.skin_type,
    season,
  };
}

/** Short headline answering "hva trenger huden min i dag?" */
export function todayNeed(sig: FitSignal): string {
  const needs: string[] = [];
  if ((sig.avgRedness ?? 0) >= 3.5 || (sig.avgSensitivity ?? 0) >= 3.5)
    needs.push("ro");
  if ((sig.avgDryness ?? 5) <= 2) needs.push("fukt");
  if ((sig.avgGlow ?? 5) < 3) needs.push("glød");
  if (sig.concerns?.includes("breakout")) needs.push("klarhet");
  if (needs.length === 0) return "Balanse";
  if (needs.length === 1) return capitalizeFirst(needs[0]);
  return `${capitalizeFirst(needs[0])} og ${needs[1]}`;
}

/** What to avoid today, as a short list */
export function todayAvoid(sig: FitSignal): string[] {
  const avoid: string[] = [];
  if ((sig.avgRedness ?? 0) >= 3.5 || (sig.avgSensitivity ?? 0) >= 3.5) {
    avoid.push("Aktive syrer");
    avoid.push("Retinol");
    avoid.push("Parfyme");
  }
  if ((sig.avgDryness ?? 5) <= 2) avoid.push("Matt foundation");
  if (sig.skinType === "sensitive") avoid.push("Hard eksfoliering");
  return Array.from(new Set(avoid)).slice(0, 3);
}

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
