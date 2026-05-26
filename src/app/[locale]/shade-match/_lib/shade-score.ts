/**
 * Foundation shade scoring for the Shade Match flow.
 *
 * Inputs:
 *   - candidate shade (product row with attributes.hex / undertone / depth)
 *   - user signal (undertone, depth, dryness, glow…)
 *   - user's loved foundations (as reference points — same undertone/depth bias)
 *
 * Output: numeric score (-100..100) + short Norwegian reason string.
 */

import type { FitSignal } from "@/lib/fit-now";

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

  let score = 0;
  const reasons: string[] = [];

  // 1. Undertone (60 pt)
  if (sig.undertone && undertone) {
    if (undertone === sig.undertone) {
      score += 60;
      reasons.push("matcher undertone");
    } else if (undertone === "neutral" || sig.undertone === "neutral") {
      score += 25;
    } else {
      score -= 40;
    }
  }

  // 2. Depth (25 pt)
  if (sig.depth && depth) {
    const diff = Math.abs(depthRank(sig.depth) - depthRank(depth));
    if (diff === 0) {
      score += 25;
      reasons.push("riktig dybde");
    } else if (diff === 1) score += 5;
    else score -= 20;
  }

  // 3. Loved reference (15 pt) — same undertone/depth as a favorite
  for (const l of loved) {
    const lAttr = l.products?.attributes ?? {};
    const lUndertone = (lAttr.undertone ?? "").toLowerCase();
    const lDepth = (lAttr.depth ?? "").toLowerCase();
    if (lUndertone === undertone && lDepth === depth) {
      score += 15;
      reasons.push(`som ${l.products?.brand ?? "favoritt"}`);
      break;
    }
    if (lAttr.hex && hex && colorDistance(lAttr.hex, hex) < 12) {
      score += 12;
      reasons.push("nær din favoritt-farge");
      break;
    }
  }

  // 4. Finish vs current need (10 pt)
  if ((sig.avgGlow ?? 5) < 3) {
    const isMatte = /matte|velvet|matt/.test(shade.name.toLowerCase()) || attr.finish === "matte";
    const isGlow = /glow|luminous|radiant|dewy|skin/.test(shade.name.toLowerCase()) || attr.finish === "dewy";
    if (isMatte) score -= 10;
    if (isGlow) {
      score += 10;
      reasons.push("gir glød");
    }
  }
  if ((sig.avgDryness ?? 5) <= 2) {
    if (/matte|matt|powder/.test(shade.name.toLowerCase())) score -= 10;
  }

  // 5. Shade-name keyword fallback (when attributes are missing)
  if (!undertone && sig.undertone && shadeName) {
    const warmHits = /(warm|golden|doré|honey|peach|caramel|chestnut)/.test(shadeName);
    const coolHits = /(cool|pink|rose|rosé|porcelain|ivory)/.test(shadeName);
    if (sig.undertone === "warm" && warmHits) score += 30;
    if (sig.undertone === "cool" && coolHits) score += 30;
    if (sig.undertone === "warm" && coolHits) score -= 25;
    if (sig.undertone === "cool" && warmHits) score -= 25;
  }

  const reason = reasons.slice(0, 2).join(" · ") || null;
  return { value: score, reason };
}

function depthRank(d: string): number {
  return { fair: 0, light: 1, medium: 2, tan: 3, deep: 4 }[d as "fair"] ?? 2;
}

/** Quick perceptual distance between two #rrggbb strings */
function colorDistance(a: string, b: string): number {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return 999;
  return Math.sqrt(
    Math.pow(pa[0] - pb[0], 2) +
      Math.pow(pa[1] - pb[1], 2) +
      Math.pow(pa[2] - pb[2], 2)
  ) / 4.42; // normalize to roughly 0..100
}

function parseHex(hex: string): [number, number, number] | null {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}
