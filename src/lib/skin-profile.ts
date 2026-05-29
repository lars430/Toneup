/**
 * Skin profile analysis — depth, undertone, redness (separate from undertone).
 *
 * Pipeline:
 *   1. Client calibration (RGB regions + paper reference)
 *   2. Heuristic profile (always, privacy-friendly)
 *   3. Optional OpenAI Vision merge when OPENAI_API_KEY + image provided
 *
 * OpenAI returns structured JSON only — never product picks.
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

export type RednessLevel = "none" | "low" | "medium" | "high";
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
  redness_level: RednessLevel;
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
  /** Legacy depth for existing UI / fit-now */
  legacy_depth: "fair" | "light" | "medium" | "tan" | "deep";
  /** Legacy undertone for shade match */
  legacy_undertone: Undertone;
  debug?: SkinProfileDebug;
}

export interface SkinProfileDebug {
  estimated_depth: SkinDepth;
  estimated_undertone: SkinUndertone;
  sampled_regions: string[];
  excluded_regions: string[];
  redness_level: RednessLevel;
  white_balance_rgb: [number, number, number] | null;
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

const SKIN_ANALYSIS_PROMPT = `You are a cosmetic color analyst. Analyze ONLY skin tone for foundation matching.
Return valid JSON matching this schema exactly (no markdown):
{
  "skin_depth": "fair|fair_light|light|light_medium|medium|tan|deep",
  "undertone": "cool|neutral_cool|neutral|neutral_warm|warm|olive",
  "redness_level": "none|low|medium|high",
  "surface_redness_regions": ["nose","central_cheeks",...],
  "white_reference_detected": boolean,
  "white_balance_status": "corrected|missing|unreliable",
  "lighting_quality": "good|acceptable|poor",
  "sampled_regions": ["forehead","temple",...],
  "excluded_regions": ["nose","beard",...],
  "recommended_foundation_depth_range": ["fair_light","light"],
  "avoid_foundation_depths": ["medium","tan","deep"],
  "avoid_undertones": ["strong_warm","golden_orange"],
  "confidence": 0.0-1.0
}

Rules:
- EXCLUDE nose, beard/shadow, lips, eyes, eyebrows, hair, hard shadows, specular highlights from depth/undertone.
- Weight forehead, temples, jawline, neck, even cheeks WITHOUT redness highest.
- Redness is separate: record redness_level and surface_redness_regions but do NOT let redness imply warm undertone or darker depth.
- If light skin with redness/beard/shadow, prefer fair_light or light — never medium/tan from mid-face redness.
- If uncertain between light and medium, choose lighter depth and lower confidence.
- If undertone uncertain, prefer neutral_cool or neutral — not warm.
- Use white paper in frame for white balance when visible.`;

/** Main entry: heuristic + optional OpenAI merge */
export async function analyzeSkinProfile(
  calibration: CalibrationInput,
  options?: { imageBase64?: string; openaiApiKey?: string }
): Promise<SkinProfile> {
  const heuristic = analyzeFromCalibration(calibration);
  const key = options?.openaiApiKey ?? process.env.OPENAI_API_KEY;
  if (!key || !options?.imageBase64) {
    return heuristic;
  }

  try {
    const vision = await analyzeWithOpenAI(calibration, options.imageBase64, key);
    return mergeProfiles(heuristic, vision);
  } catch (err) {
    console.warn("[skin-profile] OpenAI vision failed, using heuristic:", err);
    if (process.env.NODE_ENV === "development") {
      heuristic.debug = {
        ...heuristic.debug!,
        reason_for_low_confidence:
          (heuristic.debug?.reason_for_low_confidence ?? "") +
          "; openai_failed",
      };
    }
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

  const rednessByRegion: Record<string, number> = {};
  for (const [name, rgb] of Object.entries(regionsCorrected)) {
    if (rgb) rednessByRegion[name] = rednessIndex(rgb);
  }

  const elevatedRed = Object.entries(rednessByRegion)
    .filter(([, v]) => v >= 0.45)
    .map(([k]) => k);

  const alwaysExclude = new Set([
    "nose",
    "beard",
    "lips",
    "eyes",
    "eyebrows",
    "hair",
    "shadows",
  ]);
  const excluded: string[] = [
    "nose",
    "lips",
    "eyes",
    "eyebrows",
    "hair",
    "shadows",
  ];
  if (elevatedRed.includes("cheekL") || elevatedRed.includes("cheekR")) {
    excluded.push("central_cheeks");
    alwaysExclude.add("cheekL");
    alwaysExclude.add("cheekR");
  }
  if (elevatedRed.includes("chin")) {
    excluded.push("beard");
    alwaysExclude.add("chin");
  }

  const stableWeights: Array<{ name: string; rgb: [number, number, number]; w: number }> = [];
  const addStable = (name: string, w: number) => {
    const rgb = regionsCorrected[name];
    if (!rgb || alwaysExclude.has(name)) return;
    stableWeights.push({ name, rgb, w });
  };

  addStable("forehead", 0.32);
  addStable("templeL", 0.18);
  addStable("templeR", 0.18);
  addStable("jawline", 0.14);
  addStable("chin", 0.08);
  if (!alwaysExclude.has("cheekL")) addStable("cheekL", 0.05);
  if (!alwaysExclude.has("cheekR")) addStable("cheekR", 0.05);

  let sampled: string[] = stableWeights.map((s) => s.name);
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
  let skin_depth = classifySkinDepth(lightness, true);
  const undertone = classifySkinUndertone(aggregateRgb, calib.lighting, elevatedRed.length > 0);

  const redness_level = classifyRednessLevel(rednessByRegion, faceCorrected);
  const surface_redness_regions = mapRednessRegions(elevatedRed);

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
  if (elevatedRed.length >= 2) reasons.push("surface_redness");
  if ((calib.lighting?.warmthBias ?? 0) > 0.45) reasons.push("varmt_lys");

  const profile: SkinProfile = {
    skin_depth,
    undertone,
    redness_level,
    surface_redness_regions,
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
      redness_level,
      white_balance_rgb: wb.detected ? calib.paperRgb : null,
      lighting_quality,
      confidence: profile.confidence,
      reason_for_low_confidence: reasons.length ? reasons.join(", ") : undefined,
      source: "heuristic",
    };
  }

  return profile;
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
      max_tokens: 800,
      messages: [
        { role: "system", content: SKIN_ANALYSIS_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this face for foundation shade. Client RGB hints (white-balanced on device): ${regionHint}`,
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
  const useVision =
    vConf >= 0.55 &&
    vision.skin_depth &&
    vision.undertone;

  const skin_depth = (useVision ? vision.skin_depth : heuristic.skin_depth)!;
  const undertone = (useVision ? vision.undertone : heuristic.undertone)!;

  const merged: SkinProfile = {
    ...heuristic,
    skin_depth,
    undertone,
    redness_level: vision.redness_level ?? heuristic.redness_level,
    surface_redness_regions:
      vision.surface_redness_regions?.length
        ? vision.surface_redness_regions
        : heuristic.surface_redness_regions,
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
    confidence: round2(Math.max(heuristic.confidence * 0.4, vConf * 0.6 + heuristic.confidence * 0.4)),
    legacy_depth: toLegacyDepth(skin_depth),
    legacy_undertone: toLegacyUndertone(undertone),
  };

  if (process.env.NODE_ENV === "development") {
    merged.debug = {
      ...heuristic.debug!,
      estimated_depth: skin_depth,
      estimated_undertone: undertone,
      source: useVision ? "merged" : "heuristic",
      reason_for_low_confidence: useVision
        ? undefined
        : heuristic.debug?.reason_for_low_confidence,
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

  return {
    skin_depth: validDepth,
    undertone: validUt,
    redness_level: raw.redness_level as RednessLevel,
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

function classifySkinUndertone(
  rgb: [number, number, number],
  lighting: CalibrationInput["lighting"],
  hasSurfaceRedness: boolean
): SkinUndertone {
  const [r, g, b] = rgb;
  const rb = r / Math.max(1, b);
  const olive = g / Math.max(1, (r + b) / 2);
  const warm = lighting?.warmthBias ?? 0;

  if (olive > 1.03 && rb < 1.12) return "olive";
  if (rb > 1.12 && warm < 0.4 && !hasSurfaceRedness) return "warm";
  if (rb > 1.08 && warm < 0.35) return "neutral_warm";
  if (rb < 1.0) return "cool";
  if (rb < 1.05) return "neutral_cool";
  if (warm > 0.45 || hasSurfaceRedness) {
    return "neutral_cool";
  }
  return "neutral";
}

function classifyRednessLevel(
  byRegion: Record<string, number>,
  face: [number, number, number]
): RednessLevel {
  const vals = Object.values(byRegion);
  const faceVal = rednessIndex(face);
  const max = vals.length ? Math.max(...vals, faceVal) : faceVal;
  if (max < 0.3) return "none";
  if (max < 0.45) return "low";
  if (max < 0.62) return "medium";
  return "high";
}

function mapRednessRegions(elevated: string[]): string[] {
  const out: string[] = [];
  if (elevated.includes("nose")) out.push("nose");
  if (elevated.includes("cheekL") || elevated.includes("cheekR"))
    out.push("central_cheeks");
  if (elevated.includes("chin")) out.push("chin");
  return out;
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

function rednessIndex(rgb: [number, number, number]): number {
  const [r, g, b] = rgb;
  const rbRatio = r / Math.max(1, b);
  const rgGap = (r - g) / Math.max(1, r);
  const fromRb = clamp01((rbRatio - 1.05) / 0.55);
  const fromRg = clamp01(rgGap / 0.25);
  return clamp01(0.5 * fromRb + 0.5 * fromRg);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
