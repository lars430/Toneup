/**
 * Foundation shade scoring for the Shade Match flow.
 *
 * score =
 *   depth_match * 0.45
 * + undertone_match * 0.30
 * + corrected_hex_distance * 0.15
 * + product_suitability * 0.10
 * - redness_confusion_penalty
 * - too_dark_penalty
 * - too_warm_penalty
 */

import type { FitSignal } from "@/lib/fit-now";
import { depthRankExtended } from "@/lib/skin-profile";

export interface ShadeRow {
  id: string;
  brand: string;
  name: string;
  shade_name: string | null;
  shade_code: string | null;
  attributes: any;
}

interface LovedRef {
  shade_name?: string | null;
  shade_code?: string | null;
  products?: { name?: string | null; brand?: string | null; attributes?: any } | null;
}

export interface ShadeScore {
  value: number;
  reason: string | null;
}

const SCALE = 100;

export function scoreShade(
  shade: ShadeRow,
  sig: FitSignal,
  loved: LovedRef[] = []
): ShadeScore {
  const attr = shade.attributes ?? {};
  const undertone = (attr.undertone ?? "").toLowerCase();
  const depth = (attr.depth ?? "").toLowerCase();
  const shadeName = (shade.shade_name ?? "").toLowerCase();
  const hex = attr.hex ?? shade.shade_code;

  const reasons: string[] = [];
  let score = 0;

  const userDepth = sig.skinDepth ?? sig.depth ?? "";
  const userUt = sig.undertone ?? "";

  // ── depth_match (45%) ─────────────────────────────────────────────
  let depthMatch = 0.5;
  if (userDepth && depth) {
    const diff = Math.abs(depthRankExtended(userDepth) - depthRankExtended(depth));
    if (diff === 0) {
      depthMatch = 1;
      reasons.push("riktig dybde");
    } else if (diff <= 0.5) depthMatch = 0.85;
    else if (diff <= 1) depthMatch = 0.55;
    else if (diff <= 1.5) depthMatch = 0.25;
    else depthMatch = 0;
  } else if (userDepth && shadeName) {
    depthMatch = depthFromNameMatch(shadeName, userDepth);
  }
  score += depthMatch * 0.45 * SCALE;

  // ── undertone_match (30%) ───────────────────────────────────────
  let utMatch = 0.5;
  if (userUt && undertone) {
    if (undertone === userUt) {
      utMatch = 1;
      reasons.push("matcher undertone");
    } else if (undertone === "neutral" || userUt === "neutral") {
      utMatch = 0.65;
    } else if (isAdjacentUndertone(userUt, undertone)) {
      utMatch = 0.4;
    } else {
      utMatch = 0;
    }
  }
  score += utMatch * 0.3 * SCALE;

  // ── hex distance (15%) ──────────────────────────────────────────
  let hexScore = 0.5;
  if (sig.correctedSkinHex && hex) {
    const dist = colorDistance(sig.correctedSkinHex, hex);
    hexScore = clamp01(1 - dist / 35);
  }
  score += hexScore * 0.15 * SCALE;

  // ── product_suitability (10%) ─────────────────────────────────────
  let suit = 0.5;
  if ((sig.avgGlow ?? 5) < 3) {
    const isMatte =
      /matte|velvet|matt/.test(shade.name.toLowerCase()) || attr.finish === "matte";
    const isGlow =
      /glow|luminous|radiant|dewy|skin/.test(shade.name.toLowerCase()) ||
      attr.finish === "dewy";
    if (isMatte) suit -= 0.3;
    if (isGlow) {
      suit += 0.4;
      reasons.push("gir glød");
    }
  }
  if ((sig.avgDryness ?? 5) <= 2 && /matte|matt|powder/.test(shade.name.toLowerCase())) {
    suit -= 0.3;
  }
  for (const l of loved) {
    const lAttr = l.products?.attributes ?? {};
    if (
      (lAttr.undertone ?? "").toLowerCase() === undertone &&
      (lAttr.depth ?? "").toLowerCase() === depth
    ) {
      suit = 1;
      reasons.push(`som ${l.products?.brand ?? "favoritt"}`);
      break;
    }
    if (lAttr.hex && hex && colorDistance(lAttr.hex, hex) < 12) {
      suit = Math.max(suit, 0.9);
      reasons.push("nær din favoritt-farge");
      break;
    }
  }
  score += clamp01(suit) * 0.1 * SCALE;

  // ── penalties ─────────────────────────────────────────────────────
  let tooDark = 0;
  let tooWarm = 0;
  let rednessConfusion = 0;

  if (userDepth && depth) {
    const userRank = depthRankExtended(userDepth);
    const shadeRank = depthRankExtended(depth);
    if (shadeRank - userRank >= 1.5) tooDark = 0.35;
    else if (shadeRank - userRank >= 1) tooDark = 0.2;
  }

  if (sig.avoidFoundationDepths?.length && depth) {
    const expanded = sig.avoidFoundationDepths.map((d) => d.toLowerCase());
    if (expanded.some((d) => depth.includes(d) || d === depth)) tooDark = Math.max(tooDark, 0.4);
  }

  if (sig.avoidUndertones?.length) {
    const warmName = /(warm|golden|honey|doré|peach|caramel|beige chaud|b\d{2})/i.test(
      shadeName + shade.name
    );
    if (
      sig.avoidUndertones.some((a) => /warm|golden|orange/i.test(a)) &&
      (undertone === "warm" || warmName)
    ) {
      tooWarm = 0.35;
    }
  }

  if (
    (sig.rednessLevel === "medium" || sig.rednessLevel === "high") &&
    undertone === "warm" &&
    (userUt === "cool" || userUt === "neutral")
  ) {
    rednessConfusion = 0.15;
  }

  score -= (tooDark + tooWarm + rednessConfusion) * SCALE;

  // Shade-name fallback when attributes missing
  if (!undertone && userUt && shadeName) {
    const warmHits = /(warm|golden|doré|honey|peach|caramel|chestnut)/.test(shadeName);
    const coolHits = /(cool|pink|rose|rosé|porcelain|ivory)/.test(shadeName);
    if (userUt === "warm" && warmHits) score += 12;
    if (userUt === "cool" && coolHits) score += 12;
    if (userUt === "cool" && warmHits) score -= 28;
    if (userUt === "warm" && coolHits) score -= 28;
  }

  const reason = reasons.slice(0, 2).join(" · ") || null;
  return { value: Math.round(score), reason };
}

function isAdjacentUndertone(user: string, shade: string): boolean {
  const coolish = ["cool", "neutral"];
  const warmish = ["warm", "neutral"];
  if (coolish.includes(user) && coolish.includes(shade)) return true;
  if (warmish.includes(user) && warmish.includes(shade)) return true;
  return false;
}

function depthFromNameMatch(shadeName: string, userDepth: string): number {
  const dark = /(medium|tan|deep|honey|amber|chestnut|noisette|terre|b40|b50|b60|040)/i.test(
    shadeName
  );
  const light = /(fair|light|ivoire|porcelain|porcelaine|n[0-9]|w[0-9]|c[0-9])/i.test(shadeName);
  const userLight = depthRankExtended(userDepth) <= 1.5;
  if (userLight && dark) return 0.1;
  if (userLight && light) return 0.9;
  return 0.5;
}

function colorDistance(a: string, b: string): number {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return 999;
  return Math.sqrt(
    (pa[0] - pb[0]) ** 2 + (pa[1] - pb[1]) ** 2 + (pa[2] - pb[2]) ** 2
  );
}

function parseHex(hex: string): [number, number, number] | null {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
