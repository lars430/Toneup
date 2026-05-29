/**
 * Skin profile analysis — depth, undertone, redness (separate from undertone).
 *
 * Redness is measured as deviation from the user's own base skin (forehead,
 * temples, jawline) in Lab space — not absolute RGB redness. Natural
 * pink/cool undertone on fair skin is `visible_pinkness`, not `surface_redness`.
 */

import type { Undertone } from "@/engine/types";

export type SkinDepth =
  | "fair"
  | "fair_light"
  | "light"
  | "light_medium"
  | "medium"
  | "tan"
  | "deep";

export type SkinUndertone =
  | "cool"
  | "neutral_cool"
  | "neutral"
  | "neutral_warm"
  | "warm"
  | "olive";

export type Level = "none" | "low" | "medium" | "high";
/** @deprecated Use surface_redness */
export type RednessLevel = Level;

export type RednessType =
  | "none"
  | "natural_pinkness"
  | "flush"
  | "irritation"
  | "rosacea_like"
  | "uncertain";

export type WhiteBalanceStatus = "corrected" | "missing" | "unreliable";
export type LightingQualityLabel = "good" | "acceptable" | "poor";

export interface CalibrationInput {
  paperRgb: [number, number, number];
  skinRgb: [number, number, number];
  skinStdDev?: number;
  regions?: Partial<
    Record<
      | "forehead"
      | "templeL"
      | "templeR"
      | "jawline"
      | "nose"
      | "cheekL"
      | "cheekR"
      | "chin",
      { mean: [number, number, number]; stdDev: number }
    >
  >;
  lighting?: {
    brightness: number;
    warmthBias: number;
    paperUniformity: number;
    sharpness: number;
  };
  confidence: number;
}

export interface SkinProfile {
  skin_depth: SkinDepth;
  undertone: SkinUndertone;
  visible_pinkness: Level;
  surface_redness: Level;
  redness_type: RednessType;
  redness_regions: string[];
  redness_confidence: number;
  /** Same as surface_redness — kept for backward compatibility */
  redness_level: Level;
  surface_redness_regions: string[];
  white_reference_detected: boolean;
  white_balance_status: WhiteBalanceStatus;
  lighting_quality: LightingQualityLabel;
  sampled_regions: string[];
  excluded_regions: string[];
  recommended_foundation_depth_range: SkinDepth[];
  avoid_foundation_depths: SkinDepth[];
  avoid_undertones: string[];
  confidence: number;
  legacy_depth: "fair" | "light" | "medium" | "tan" | "deep";
  legacy_undertone: Undertone;
  debug?: SkinProfileDebug;
}

export interface SkinProfileDebug {
  estimated_depth: SkinDepth;
  estimated_undertone: SkinUndertone;
  sampled_regions: string[];
  excluded_regions: string[];
  base_skin_rgb_lab: [number, number, number];
  redness_zone_rgb_lab: Record<string, [number, number, number]>;
  redness_delta_from_base: Record<string, number>;
  visible_pinkness: Level;
  surface_redness: Level;
  redness_type: RednessType;
  redness_regions: string[];
  redness_confidence: number;
  white_balance_status: WhiteBalanceStatus;
  lighting_quality: LightingQualityLabel;
  confidence: number;
  reason_for_low_confidence?: string;
  source: "heuristic" | "openai" | "merged";
}

const DEPTH_ORDER: SkinDepth[] = [
  "fair",
  "fair_light",
  "light",
  "light_medium",
  "medium",
  "tan",
  "deep",
];

const BASE_REGIONS = ["forehead", "templeL", "templeR", "jawline"] as const;
const REDNESS_ZONE_KEYS = ["nose", "cheekL", "cheekR", "chin"] as const;

const SKIN_ANALYSIS_PROMPT = `You are a cosmetic color analyst. Return JSON only:
{
  "skin_depth": "fair|fair_light|light|light_medium|medium|tan|deep",
  "undertone": "cool|neutral_cool|neutral|neutral_warm|warm|olive",
  "visible_pinkness": "none|low|medium|high",
  "surface_redness": "none|low|medium|high",
  "redness_type": "none|natural_pinkness|flush|irritation|rosacea_like|uncertain",
  "redness_regions": [],
  "redness_confidence": 0.0-1.0,
  "white_reference_detected": boolean,
  "white_balance_status": "corrected|missing|unreliable",
  "lighting_quality": "good|acceptable|poor",
  "sampled_regions": [],
  "excluded_regions": [],
  "recommended_foundation_depth_range": [],
  "avoid_foundation_depths": [],
  "avoid_undertones": [],
  "confidence": 0.0-1.0
}

Redness rules (critical):
- Do NOT treat natural pink/cool undertone on fair Scandinavian skin as high surface_redness.
- surface_redness = zones clearly redder than the person's OWN forehead/temple/jawline base — not absolute pinkness.
- visible_pinkness = even rosy/cool cast without localized flush zones; does NOT mean a skin problem.
- If whole face is evenly pink with no stronger nose/cheek zones → natural_pinkness + low surface_redness.
- Localized nose/cheeks much redder than forehead/jaw → surface_redness + flush/irritation/rosacea_like.
- surface_redness must NOT change skin_depth or push undertone to cool.
- For fair/fair_light/light skin, be conservative — most even pink faces are visible_pinkness low/medium, surface_redness none/low.
- Lower redness_confidence if lighting or white balance is poor.`;

export async function analyzeSkinProfile(
  calibration: CalibrationInput,
  options?: { imageBase64?: string; openaiApiKey?: string }
): Promise<SkinProfile> {
  const heuristic = analyzeFromCalibration(calibration);
  const key = options?.openaiApiKey ?? process.env.OPENAI_API_KEY;
  if (!key || !options?.imageBase64) return heuristic;

  try {
    const vision = await analyzeWithOpenAI(calibration, options.imageBase64, key);
    return mergeProfiles(heuristic, vision);
  } catch (err) {
    console.warn("[skin-profile] OpenAI vision failed, using heuristic:", err);
    return heuristic;
  }
}

export function analyzeFromCalibration(calib: CalibrationInput): SkinProfile {
  const gains = computeGains(calib.paperRgb);
  const wb = assessWhiteBalance(calib, gains);

  const regionsCorrected: Record<string, [number, number, number] | null> = {};
  for (const [name, sample] of Object.entries(calib.regions ?? {})) {
    if (sample?.mean) regionsCorrected[name] = applyWB(sample.mean, gains);
  }
  const faceCorrected = applyWB(calib.skinRgb, gains);

  const rednessAnalysis = analyzeRelativeRedness(
    regionsCorrected,
    faceCorrected,
    calib.lighting,
    wb
  );

  const excluded: string[] = [
    "nose",
    "lips",
    "eyes",
    "eyebrows",
    "hair",
    "shadows",
  ];
  if (rednessAnalysis.elevatedZones.includes("cheekL") || rednessAnalysis.elevatedZones.includes("cheekR")) {
    excluded.push("central_cheeks");
  }
  if (rednessAnalysis.elevatedZones.includes("chin")) excluded.push("beard");

  const stableWeights: Array<{ name: string; rgb: [number, number, number]; w: number }> = [];
  const skipCheeks =
    rednessAnalysis.elevatedZones.includes("cheekL") ||
    rednessAnalysis.elevatedZones.includes("cheekR");

  for (const name of BASE_REGIONS) {
    const rgb = regionsCorrected[name];
    if (rgb) stableWeights.push({ name, rgb, w: name === "forehead" ? 0.34 : 0.22 });
  }
  if (!skipCheeks) {
    for (const name of ["cheekL", "cheekR"] as const) {
      const rgb = regionsCorrected[name];
      if (rgb) stableWeights.push({ name, rgb, w: 0.05 });
    }
  }
  const chinRgb = regionsCorrected.chin;
  if (chinRgb && !rednessAnalysis.elevatedZones.includes("chin")) {
    stableWeights.push({ name: "chin", rgb: chinRgb, w: 0.06 });
  }

  let sampled = stableWeights.map((s) => s.name);
  let aggregateRgb: [number, number, number];

  if (stableWeights.length >= 2) {
    const tw = stableWeights.reduce((s, x) => s + x.w, 0);
    aggregateRgb = [
      stableWeights.reduce((s, x) => s + x.rgb[0] * x.w, 0) / tw,
      stableWeights.reduce((s, x) => s + x.rgb[1] * x.w, 0) / tw,
      stableWeights.reduce((s, x) => s + x.rgb[2] * x.w, 0) / tw,
    ] as [number, number, number];
  } else {
    aggregateRgb = faceCorrected;
    sampled = ["face_fallback"];
  }

  const { lightness } = rgbToHsl(aggregateRgb);
  const skin_depth = classifySkinDepth(lightness, true);
  const undertone = classifySkinUndertone(
    aggregateRgb,
    calib.lighting,
    rednessAnalysis.visible_pinkness,
    rednessAnalysis.surface_redness
  );

  let confidence = calib.confidence * (1 - wb.penalty);
  if (wb.status === "unreliable") confidence *= 0.65;
  if (calib.lighting && calib.lighting.sharpness < 0.3) confidence *= 0.85;
  if (stableWeights.length < 2) confidence *= 0.75;

  const lighting_quality = describeLightingQuality(calib, wb);
  const recommended_foundation_depth_range = depthRangeFor(skin_depth);
  const avoid_foundation_depths = avoidDepthsFor(skin_depth);
  const avoid_undertones =
    undertone === "cool" || undertone === "neutral_cool"
      ? ["strong_warm", "golden_orange"]
      : undertone === "neutral"
        ? ["strong_warm"]
        : [];

  const reasons: string[] = [];
  if (wb.status === "unreliable") reasons.push("hvitbalanse_usikker");
  if (stableWeights.length < 2) reasons.push("fa_stable_regioner");
  if (rednessAnalysis.redness_confidence < 0.45) reasons.push("redness_usikker");
  if ((calib.lighting?.warmthBias ?? 0) > 0.45) reasons.push("varmt_lys");

  const profile: SkinProfile = {
    skin_depth,
    undertone,
    visible_pinkness: rednessAnalysis.visible_pinkness,
    surface_redness: rednessAnalysis.surface_redness,
    redness_type: rednessAnalysis.redness_type,
    redness_regions: rednessAnalysis.redness_regions,
    redness_confidence: rednessAnalysis.redness_confidence,
    redness_level: rednessAnalysis.surface_redness,
    surface_redness_regions: rednessAnalysis.redness_regions,
    white_reference_detected: wb.detected,
    white_balance_status: wb.status,
    lighting_quality,
    sampled_regions: sampled,
    excluded_regions: excluded,
    recommended_foundation_depth_range,
    avoid_foundation_depths,
    avoid_undertones,
    confidence: round2(Math.max(0.15, Math.min(1, confidence))),
    legacy_depth: toLegacyDepth(skin_depth),
    legacy_undertone: toLegacyUndertone(undertone),
  };

  if (process.env.NODE_ENV === "development") {
    profile.debug = {
      estimated_depth: skin_depth,
      estimated_undertone: undertone,
      sampled_regions: sampled,
      excluded_regions: excluded,
      base_skin_rgb_lab: rednessAnalysis.baseLab,
      redness_zone_rgb_lab: rednessAnalysis.zoneLabs,
      redness_delta_from_base: rednessAnalysis.deltas,
      visible_pinkness: rednessAnalysis.visible_pinkness,
      surface_redness: rednessAnalysis.surface_redness,
      redness_type: rednessAnalysis.redness_type,
      redness_regions: rednessAnalysis.redness_regions,
      redness_confidence: rednessAnalysis.redness_confidence,
      white_balance_status: wb.status,
      lighting_quality,
      confidence: profile.confidence,
      reason_for_low_confidence: reasons.length ? reasons.join(", ") : undefined,
      source: "heuristic",
    };
  }

  return profile;
}

interface RelativeRednessResult {
  visible_pinkness: Level;
  surface_redness: Level;
  redness_type: RednessType;
  redness_regions: string[];
  redness_confidence: number;
  elevatedZones: string[];
  baseLab: [number, number, number];
  zoneLabs: Record<string, [number, number, number]>;
  deltas: Record<string, number>;
}

function analyzeRelativeRedness(
  regions: Record<string, [number, number, number] | null>,
  faceRgb: [number, number, number],
  lighting: CalibrationInput["lighting"],
  wb: { status: WhiteBalanceStatus; penalty: number }
): RelativeRednessResult {
  const baseSamples: Array<{ rgb: [number, number, number]; w: number }> = [];
  for (const name of BASE_REGIONS) {
    const rgb = regions[name];
    if (rgb) baseSamples.push({ rgb, w: name === "forehead" ? 0.4 : 0.2 });
  }

  const fallbackRgb = faceRgb;
  const baseRgb =
    baseSamples.length > 0
      ? (weightedRgb(baseSamples) as [number, number, number])
      : fallbackRgb;
  const baseLab = rgbToLab(baseRgb);

  const zoneLabs: Record<string, [number, number, number]> = {};
  const deltas: Record<string, number> = {};
  const elevatedZones: string[] = [];

  const isLightBase = baseLab[0] > 62;
  const thresholds = rednessThresholds(isLightBase);

  for (const name of REDNESS_ZONE_KEYS) {
    const rgb = regions[name];
    if (!rgb) continue;
    const lab = rgbToLab(rgb);
    zoneLabs[name] = lab;
    const delta = rednessDeltaFromBase(lab, baseLab);
    deltas[name] = round2(delta);
    if (delta >= thresholds.zoneElevated) elevatedZones.push(name);
  }

  const zoneDeltaVals = Object.values(deltas);
  const maxDelta = zoneDeltaVals.length ? Math.max(...zoneDeltaVals) : 0;
  const avgZoneDelta =
    zoneDeltaVals.length > 0
      ? zoneDeltaVals.reduce((a, b) => a + b, 0) / zoneDeltaVals.length
      : 0;

  const allLabs = [...baseSamples.map((s) => rgbToLab(s.rgb)), ...Object.values(zoneLabs)];
  const aSpread =
    allLabs.length >= 3
      ? stdDev(allLabs.map((l) => l[1]))
      : maxDelta;

  const visible_pinkness = classifyVisiblePinkness(baseLab, isLightBase);
  const { surface_redness, redness_regions, redness_type } = classifySurfaceRedness({
    maxDelta,
    avgZoneDelta,
    aSpread,
    elevatedZones,
    visible_pinkness,
    deltas,
    thresholds,
    isLightBase,
  });

  let redness_confidence = 0.85;
  if (baseSamples.length < 2) redness_confidence -= 0.25;
  if (wb.status === "unreliable") redness_confidence -= 0.35;
  if ((lighting?.warmthBias ?? 0) > 0.4) redness_confidence -= 0.15;
  if ((lighting?.warmthBias ?? 0) > 0.55) redness_confidence -= 0.1;
  if ((lighting?.brightness ?? 0.5) < 0.45) redness_confidence -= 0.15;
  if ((lighting?.sharpness ?? 0.5) < 0.3) redness_confidence -= 0.1;
  redness_confidence = round2(clamp01(redness_confidence));

  return {
    visible_pinkness,
    surface_redness,
    redness_type,
    redness_regions,
    redness_confidence,
    elevatedZones,
    baseLab,
    zoneLabs,
    deltas,
  };
}

function rednessThresholds(lightSkin: boolean) {
  if (lightSkin) {
    return {
      zoneElevated: 11,
      surfaceLow: 7,
      surfaceMedium: 12,
      surfaceHigh: 18,
      evenPinkSpread: 5.5,
    };
  }
  return {
    zoneElevated: 8,
    surfaceLow: 5,
    surfaceMedium: 9,
    surfaceHigh: 14,
    evenPinkSpread: 4,
  };
}

/** Deviation in Lab — a* weighted (red-green) */
function rednessDeltaFromBase(
  zone: [number, number, number],
  base: [number, number, number]
): number {
  const da = zone[1] - base[1];
  const db = zone[2] - base[2];
  return Math.sqrt(da * da + db * db * 0.25);
}

function classifyVisiblePinkness(
  baseLab: [number, number, number],
  lightSkin: boolean
): Level {
  const a = baseLab[1];
  const b = baseLab[2];
  if (lightSkin) {
    if (a < 6) return "none";
    if (a < 9) return "low";
    if (a < 13) return "medium";
    return "high";
  }
  if (a < 8) return "none";
  if (a < 11) return "low";
  if (a < 15) return "medium";
  return "high";
}

function classifySurfaceRedness(ctx: {
  maxDelta: number;
  avgZoneDelta: number;
  aSpread: number;
  elevatedZones: string[];
  visible_pinkness: Level;
  deltas: Record<string, number>;
  thresholds: ReturnType<typeof rednessThresholds>;
  isLightBase: boolean;
}): {
  surface_redness: Level;
  redness_regions: string[];
  redness_type: RednessType;
} {
  const {
    maxDelta,
    avgZoneDelta,
    aSpread,
    elevatedZones,
    visible_pinkness,
    deltas,
    thresholds,
    isLightBase,
  } = ctx;

  const redness_regions = mapRednessRegions(elevatedZones);

  const evenPink =
    aSpread <= thresholds.evenPinkSpread &&
    maxDelta < thresholds.surfaceMedium &&
    visible_pinkness !== "none";

  if (evenPink || (maxDelta < thresholds.surfaceLow && elevatedZones.length === 0)) {
    return {
      surface_redness: maxDelta >= thresholds.surfaceLow * 0.85 ? "low" : "none",
      redness_regions: [],
      redness_type:
        visible_pinkness === "none" ? "none" : "natural_pinkness",
    };
  }

  if (maxDelta < thresholds.surfaceLow) {
    return {
      surface_redness: "none",
      redness_regions: [],
      redness_type: visible_pinkness === "none" ? "none" : "natural_pinkness",
    };
  }

  let surface_redness: Level = "low";
  if (maxDelta >= thresholds.surfaceHigh) surface_redness = "high";
  else if (maxDelta >= thresholds.surfaceMedium) surface_redness = "medium";

  const noseHigh = (deltas.nose ?? 0) >= thresholds.surfaceMedium;
  const cheeksHigh =
    (deltas.cheekL ?? 0) >= thresholds.surfaceMedium ||
    (deltas.cheekR ?? 0) >= thresholds.surfaceMedium;
  const central = noseHigh && cheeksHigh;

  let redness_type: RednessType = "uncertain";
  if (surface_redness === "low" && !central) {
    redness_type = elevatedZones.length ? "flush" : "natural_pinkness";
  } else if (central && surface_redness !== "low") {
    redness_type =
      surface_redness === "high" && isLightBase ? "rosacea_like" : "flush";
  } else if (elevatedZones.length >= 2 && surface_redness !== "low") {
    redness_type = "irritation";
  } else if (elevatedZones.length === 1) {
    redness_type = "flush";
  }

  return { surface_redness, redness_regions, redness_type };
}

function mapRednessRegions(elevated: string[]): string[] {
  const out: string[] = [];
  if (elevated.includes("nose")) out.push("nose");
  if (elevated.includes("cheekL") || elevated.includes("cheekR"))
    out.push("central_cheeks");
  if (elevated.includes("chin")) out.push("chin");
  return out;
}

function classifySkinUndertone(
  rgb: [number, number, number],
  lighting: CalibrationInput["lighting"],
  visiblePinkness: Level,
  surfaceRedness: Level
): SkinUndertone {
  const [r, g, b] = rgb;
  const rb = r / Math.max(1, b);
  const olive = g / Math.max(1, (r + b) / 2);
  const warm = lighting?.warmthBias ?? 0;

  if (olive > 1.03 && rb < 1.12) return "olive";
  if (rb > 1.12 && warm < 0.4 && surfaceRedness === "none") return "warm";
  if (rb > 1.08 && warm < 0.35 && surfaceRedness !== "high") return "neutral_warm";
  if (rb < 1.0 || visiblePinkness === "high") return "cool";
  if (rb < 1.06 || visiblePinkness === "medium") return "neutral_cool";
  if (warm > 0.5) return "neutral";
  return "neutral";
}

async function analyzeWithOpenAI(
  calibration: CalibrationInput,
  imageBase64: string,
  apiKey: string
): Promise<Partial<SkinProfile>> {
  const regionHint = JSON.stringify({
    paperRgb: calibration.paperRgb,
    clientRegions: calibration.regions,
    lighting: calibration.lighting,
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 900,
      messages: [
        { role: "system", content: SKIN_ANALYSIS_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze foundation-relevant skin tone. Client hints: ${regionHint}`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith("data:")
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("empty OpenAI response");
  return normalizeOpenAIJson(JSON.parse(text));
}

function mergeProfiles(heuristic: SkinProfile, vision: Partial<SkinProfile>): SkinProfile {
  const vConf = vision.confidence ?? 0;
  const useVision = vConf >= 0.55 && vision.skin_depth && vision.undertone;

  const skin_depth = (useVision ? vision.skin_depth : heuristic.skin_depth)!;
  const undertone = (useVision ? vision.undertone : heuristic.undertone)!;

  const surface_redness =
    vision.surface_redness ?? vision.redness_level ?? heuristic.surface_redness;
  const visible_pinkness = vision.visible_pinkness ?? heuristic.visible_pinkness;

  const merged: SkinProfile = {
    ...heuristic,
    skin_depth,
    undertone,
    visible_pinkness,
    surface_redness,
    redness_type: vision.redness_type ?? heuristic.redness_type,
    redness_regions: vision.redness_regions?.length
      ? vision.redness_regions
      : heuristic.redness_regions,
    redness_confidence: round2(
      vision.redness_confidence ?? heuristic.redness_confidence
    ),
    redness_level: surface_redness,
    surface_redness_regions:
      vision.redness_regions ?? vision.surface_redness_regions ?? heuristic.surface_redness_regions,
    white_reference_detected:
      vision.white_reference_detected ?? heuristic.white_reference_detected,
    white_balance_status:
      vision.white_balance_status ?? heuristic.white_balance_status,
    lighting_quality: vision.lighting_quality ?? heuristic.lighting_quality,
    sampled_regions: vision.sampled_regions?.length
      ? vision.sampled_regions
      : heuristic.sampled_regions,
    excluded_regions: vision.excluded_regions?.length
      ? vision.excluded_regions
      : heuristic.excluded_regions,
    recommended_foundation_depth_range:
      vision.recommended_foundation_depth_range?.length
        ? vision.recommended_foundation_depth_range
        : depthRangeFor(skin_depth),
    avoid_foundation_depths:
      vision.avoid_foundation_depths?.length
        ? vision.avoid_foundation_depths
        : avoidDepthsFor(skin_depth),
    avoid_undertones: vision.avoid_undertones ?? heuristic.avoid_undertones,
    confidence: round2(
      Math.max(heuristic.confidence * 0.4, vConf * 0.6 + heuristic.confidence * 0.4)
    ),
    legacy_depth: toLegacyDepth(skin_depth),
    legacy_undertone: toLegacyUndertone(undertone),
  };

  if (process.env.NODE_ENV === "development") {
    merged.debug = {
      ...heuristic.debug!,
      estimated_depth: skin_depth,
      estimated_undertone: undertone,
      visible_pinkness,
      surface_redness,
      source: useVision ? "merged" : "heuristic",
    };
  }

  return merged;
}

function normalizeOpenAIJson(raw: Record<string, unknown>): Partial<SkinProfile> {
  const depth = raw.skin_depth as string;
  const validDepth = DEPTH_ORDER.includes(depth as SkinDepth)
    ? (depth as SkinDepth)
    : undefined;

  const ut = raw.undertone as string;
  const validUt = [
    "cool",
    "neutral_cool",
    "neutral",
    "neutral_warm",
    "warm",
    "olive",
  ].includes(ut)
    ? (ut as SkinUndertone)
    : undefined;

  const surface =
    (raw.surface_redness as Level) ??
    (raw.redness_level as Level);

  return {
    skin_depth: validDepth,
    undertone: validUt,
    visible_pinkness: raw.visible_pinkness as Level,
    surface_redness: surface,
    redness_type: raw.redness_type as RednessType,
    redness_regions: Array.isArray(raw.redness_regions)
      ? (raw.redness_regions as string[])
      : Array.isArray(raw.surface_redness_regions)
        ? (raw.surface_redness_regions as string[])
        : [],
    redness_confidence:
      typeof raw.redness_confidence === "number" ? raw.redness_confidence : undefined,
    redness_level: surface,
    surface_redness_regions: Array.isArray(raw.surface_redness_regions)
      ? (raw.surface_redness_regions as string[])
      : [],
    white_reference_detected: Boolean(raw.white_reference_detected),
    white_balance_status: raw.white_balance_status as WhiteBalanceStatus,
    lighting_quality: raw.lighting_quality as LightingQualityLabel,
    sampled_regions: Array.isArray(raw.sampled_regions)
      ? (raw.sampled_regions as string[])
      : [],
    excluded_regions: Array.isArray(raw.excluded_regions)
      ? (raw.excluded_regions as string[])
      : [],
    recommended_foundation_depth_range: Array.isArray(
      raw.recommended_foundation_depth_range
    )
      ? (raw.recommended_foundation_depth_range as SkinDepth[])
      : [],
    avoid_foundation_depths: Array.isArray(raw.avoid_foundation_depths)
      ? (raw.avoid_foundation_depths as SkinDepth[])
      : [],
    avoid_undertones: Array.isArray(raw.avoid_undertones)
      ? (raw.avoid_undertones as string[])
      : [],
    confidence: typeof raw.confidence === "number" ? raw.confidence : 0.7,
  };
}

function assessWhiteBalance(
  calib: CalibrationInput,
  gains: [number, number, number]
): { status: WhiteBalanceStatus; detected: boolean; penalty: number } {
  const [r, g, b] = calib.paperRgb;
  const bright = (r + g + b) / 3;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);

  if (bright < 120) {
    return { status: "unreliable", detected: false, penalty: 0.35 };
  }
  if (bright > 248 || spread > 35) {
    return { status: "unreliable", detected: true, penalty: 0.3 };
  }
  if (b > r + 15) {
    return { status: "unreliable", detected: true, penalty: 0.25 };
  }
  if (r > b + 25 && bright < 200) {
    return { status: "unreliable", detected: true, penalty: 0.2 };
  }
  if (spread > 22 || (calib.lighting?.paperUniformity ?? 0) > 28) {
    return { status: "unreliable", detected: true, penalty: 0.15 };
  }

  const maxGain = Math.max(...gains);
  if (maxGain > 2.2 || maxGain < 0.5) {
    return { status: "unreliable", detected: true, penalty: 0.2 };
  }

  return { status: "corrected", detected: bright >= 170, penalty: 0 };
}

function classifySkinDepth(lightness: number, conservative: boolean): SkinDepth {
  if (lightness > 0.82) return "fair";
  if (lightness > 0.74) return "fair_light";
  if (lightness > 0.66) return "light";
  if (lightness > 0.58) return conservative ? "light" : "light_medium";
  if (lightness > 0.50) return conservative ? "light" : "medium";
  if (lightness > 0.42) return "medium";
  if (lightness > 0.32) return "tan";
  return "deep";
}

function depthRangeFor(depth: SkinDepth): SkinDepth[] {
  const i = DEPTH_ORDER.indexOf(depth);
  const lo = DEPTH_ORDER[Math.max(0, i - 1)];
  const hi = DEPTH_ORDER[Math.min(DEPTH_ORDER.length - 1, i + 1)];
  return [lo, depth, hi].filter((v, idx, arr) => arr.indexOf(v) === idx);
}

function avoidDepthsFor(depth: SkinDepth): SkinDepth[] {
  const i = DEPTH_ORDER.indexOf(depth);
  if (i <= 2) return ["medium", "tan", "deep", "light_medium"];
  if (i <= 3) return ["tan", "deep"];
  return [];
}

function describeLightingQuality(
  calib: CalibrationInput,
  wb: { status: WhiteBalanceStatus }
): LightingQualityLabel {
  const l = calib.lighting;
  if (!l || wb.status === "unreliable") return "poor";
  if (l.brightness < 0.4 || l.sharpness < 0.25 || l.warmthBias > 0.55) return "poor";
  if (l.brightness < 0.55 || l.sharpness < 0.35 || l.warmthBias > 0.4)
    return "acceptable";
  return "good";
}

export function toLegacyDepth(d: SkinDepth): "fair" | "light" | "medium" | "tan" | "deep" {
  if (d === "fair" || d === "fair_light") return "fair";
  if (d === "light" || d === "light_medium") return "light";
  if (d === "medium") return "medium";
  if (d === "tan") return "tan";
  return "deep";
}

export function toLegacyUndertone(u: SkinUndertone): Undertone {
  if (u === "cool" || u === "neutral_cool") return "cool";
  if (u === "warm" || u === "neutral_warm") return "warm";
  if (u === "olive") return "olive";
  return "neutral";
}

export function depthRankExtended(d: string): number {
  const map: Record<string, number> = {
    fair: 0,
    fair_light: 0.5,
    light: 1,
    light_medium: 1.5,
    medium: 2,
    tan: 3,
    deep: 4,
  };
  return map[d] ?? 2;
}

/** Map surface_redness to 0–100 priority score for skincare UI */
export function surfaceRednessToScore(level: Level): number {
  return { none: 22, low: 38, medium: 58, high: 76 }[level];
}

function computeGains(paperRgb: [number, number, number]): [number, number, number] {
  const [r, g, b] = paperRgb;
  const target = Math.max(r, g, b, 1);
  return [target / Math.max(r, 1), target / Math.max(g, 1), target / Math.max(b, 1)];
}

function applyWB(
  rgb: [number, number, number],
  gains: [number, number, number]
): [number, number, number] {
  return [
    Math.min(255, rgb[0] * gains[0]),
    Math.min(255, rgb[1] * gains[1]),
    Math.min(255, rgb[2] * gains[2]),
  ];
}

function weightedRgb(samples: Array<{ rgb: [number, number, number]; w: number }>) {
  const tw = samples.reduce((s, x) => s + x.w, 0);
  return [
    samples.reduce((s, x) => s + x.rgb[0] * x.w, 0) / tw,
    samples.reduce((s, x) => s + x.rgb[1] * x.w, 0) / tw,
    samples.reduce((s, x) => s + x.rgb[2] * x.w, 0) / tw,
  ] as [number, number, number];
}

function rgbToHsl([r, g, b]: [number, number, number]) {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  }
  return { lightness: l, saturation: s };
}

function rgbToLab(rgb: [number, number, number]): [number, number, number] {
  let r = rgb[0] / 255;
  let g = rgb[1] / 255;
  let b = rgb[2] / 255;
  const lin = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  r = lin(r);
  g = lin(g);
  b = lin(b);
  let x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  let y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  let z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;
  x /= 0.95047;
  y /= 1.0;
  z /= 1.08883;
  const f = (t: number) =>
    t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const labB = 200 * (fy - fz);
  return [L, a, labB];
}

function stdDev(vals: number[]): number {
  if (vals.length < 2) return 0;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
