/**
 * Skincare ranking for the Routine Match flow.
 *
 * Given a candidate product (raw row) and the user's signal (skin type,
 * concerns, log averages, life phase, budget), produce a numeric score
 * (-100..150) plus a short Norwegian reason.
 *
 * Mirrors the structure of shade-score.ts.
 */

import type { FitSignal } from "@/lib/fit-now";
import { deriveSkincareInfo } from "@/lib/skincare-info";

export interface SkincareRow {
  id: string;
  brand: string;
  name: string;
  category: string;
  price_tier: string | null;
  attributes: any;
}

export interface UserPrefs {
  skinType?: string | null;
  lifePhase?: string | null;
  budget?: string | null;
  fragranceFree?: boolean;
  vegan?: boolean;
}

export interface SkincareScore {
  value: number;
  reason: string | null;
  /** Hard filter — should be hidden completely */
  excluded?: boolean;
}

export function scoreSkincare(
  product: SkincareRow,
  sig: FitSignal,
  prefs: UserPrefs
): SkincareScore {
  const info = deriveSkincareInfo({
    name: product.name,
    category: product.category,
    attributes: product.attributes,
  });
  const attr = product.attributes ?? {};
  const skinTypes = arr(attr.skin_type).map(lower);
  const addresses = [...arr(attr.addresses), ...arr(attr.concern)].map(lower);
  const name = product.name.toLowerCase();

  let score = 0;
  const reasons: string[] = [];

  // ── HARD FILTERS ──────────────────────────────────────────
  // Pregnancy unsafe
  if (prefs.lifePhase === "pregnancy") {
    if (info.pregnancySafe === false || info.activeType === "retinoid") {
      return {
        value: -200,
        reason: "Ikke trygt i graviditet",
        excluded: true,
      };
    }
  }

  // ── SKIN TYPE MATCH (30) ──────────────────────────────────
  if (prefs.skinType && skinTypes.length) {
    const userType = prefs.skinType.toLowerCase();
    if (skinTypes.includes(userType)) {
      score += 30;
      reasons.push("matcher hudtypen din");
    } else if (skinTypes.includes("all") || skinTypes.includes("alle")) {
      score += 15;
    } else if (isTypeConflict(userType, skinTypes)) {
      score -= 20;
    }
  } else if (skinTypes.includes("all")) {
    score += 10;
  }

  // ── CONCERN MATCH (40) ────────────────────────────────────
  const sigConcerns = sig.concerns ?? [];
  const matchedConcerns: string[] = [];

  // Map user signal to canonical concern keywords
  const need: string[] = [];
  if ((sig.avgDryness ?? 5) <= 2) need.push("hydration", "less_dryness");
  if ((sig.avgRedness ?? 0) >= 3.5) need.push("redness", "soothing", "barrier");
  if ((sig.avgGlow ?? 5) < 3) need.push("brightening", "glow");
  if ((sig.avgSensitivity ?? 0) >= 3.5) need.push("soothing", "barrier", "sensitive");
  for (const c of sigConcerns) need.push(c);

  for (const n of need) {
    if (addresses.includes(n) || addresses.includes(n.replace("_", " "))) {
      matchedConcerns.push(n);
    }
  }

  if (matchedConcerns.length > 0) {
    score += Math.min(40, matchedConcerns.length * 20);
    const top = friendlyConcern(matchedConcerns[0]);
    if (top) reasons.push(`adresserer ${top}`);
  }

  // Name-based concern detection — fallback when attributes are sparse
  if (need.includes("hydration") && /hydrat|moistur|hyaluron|aqua|fukt/.test(name)) {
    score += 15;
    if (matchedConcerns.length === 0) reasons.push("gir fukt");
  }
  if (need.includes("soothing") && /calm|cica|niacinamid|centella|sensitiv|panthenol/.test(name)) {
    score += 15;
    if (matchedConcerns.length === 0) reasons.push("beroligende");
  }
  if (need.includes("brightening") && /glow|vitamin c|brighten|radiance|illumin/.test(name)) {
    score += 15;
    if (matchedConcerns.length === 0) reasons.push("gir glød");
  }

  // ── SENSITIVITY GATE ──────────────────────────────────────
  const sensitiveNow =
    (sig.avgRedness ?? 0) >= 3.5 ||
    (sig.avgSensitivity ?? 0) >= 3.5 ||
    prefs.skinType === "sensitive";

  if (sensitiveNow && info.activeType) {
    if (
      info.activeType === "retinoid" ||
      info.activeType === "aha" ||
      info.activeType === "bha" ||
      info.activeType === "exfoliant"
    ) {
      score -= 35;
      reasons.length = 0;
      reasons.push("pause ved forhøyet sensitivitet");
    }
  }

  // ── FRAGRANCE-FREE PREFERENCE (10) ────────────────────────
  if (prefs.fragranceFree || prefs.skinType === "sensitive") {
    if (attr.fragrance_free === true) {
      score += 10;
      reasons.push("parfymefritt");
    }
  }

  // ── VEGAN PREFERENCE (5) ──────────────────────────────────
  if (prefs.vegan && attr.vegan === true) {
    score += 5;
  }

  // ── BUDGET ALIGNMENT (10) ─────────────────────────────────
  if (prefs.budget && product.price_tier) {
    if (product.price_tier === prefs.budget) score += 10;
    else if (budgetDistance(product.price_tier, prefs.budget) === 1) score += 3;
    else score -= 5;
  }

  // ── PREGNANCY-SAFE BONUS (5) when relevant ───────────────
  if (prefs.lifePhase === "pregnancy" && info.pregnancySafe === true) {
    score += 5;
    reasons.push("trygt i graviditet");
  }

  const reason = reasons.slice(0, 2).join(" · ") || null;
  return { value: score, reason };
}

// ────────────────────────────────────────────────────────────────────

function arr(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string") return [v];
  return [];
}

function lower(s: string): string {
  return s.toLowerCase();
}

function isTypeConflict(userType: string, productTypes: string[]): boolean {
  if (userType === "dry" && productTypes.includes("oily")) return true;
  if (userType === "oily" && productTypes.includes("dry")) return true;
  return false;
}

function friendlyConcern(c: string): string | null {
  const m: Record<string, string> = {
    hydration: "tørrhet",
    less_dryness: "tørrhet",
    redness: "rødhet",
    soothing: "sensitivitet",
    barrier: "barriere",
    brightening: "matt hud",
    glow: "glød",
    anti_aging: "tegn på modning",
    "anti-aging": "tegn på modning",
    pores: "porer",
    pore_minimizing: "porer",
    acne: "urenheter",
    less_acne: "urenheter",
    sensitive: "sensitiv hud",
  };
  return m[c.toLowerCase()] ?? null;
}

function budgetDistance(a: string, b: string): number {
  const order = ["budget", "mid", "premium", "luxury"];
  return Math.abs(order.indexOf(a) - order.indexOf(b));
}
