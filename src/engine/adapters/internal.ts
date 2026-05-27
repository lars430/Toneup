/**
 * InternalAdapter — Toneups egen analyse-motor.
 *
 * Designprinsipp:
 *   Scorer (0–100) er RELATIVE prioriteringssignaler, ikke kliniske målinger.
 *   Vi skiller eksplisitt mellom hva bildet *viser* (observasjoner), hva det
 *   *kan tyde på* (tolkninger), og hva brukeren *bør prioritere* (anbefalinger).
 *
 * Klienten kjører kalibrering i nettleseren og sender:
 *   - paperRgb / skinRgb (gjennomsnitt)
 *   - regions: per-region samples (forehead, nose, cheekL, cheekR, chin)
 *   - lighting: warmthBias, brightness, sharpness, paperUniformity
 *   - confidence: 0..1 fra klientens kalibreringsritualet
 *
 * Vi reduserer score-tillit hvis:
 *   - lyset er varmt eller dimt
 *   - bildet er uskarpt
 *   - rødhet er høy (kan farge undertone-vurderingen)
 *   - kalibreringen var svak
 *
 * Vi bygger IKKE konklusjoner om tørrhet fra én RGB-prøve. Det er en
 * logg-/historikk-sak, ikke en bilde-sak.
 */

import type {
  AnalysisProvider,
  ImageInput,
  UserContext,
  SkinAnalysisResult,
  ShadeMatch,
  ProductSuggestion,
  ConfidenceLevel,
  Undertone,
  RednessPattern,
} from "../types";
import type { ProductCategory } from "@/types/domain";

interface RegionSample {
  mean: [number, number, number];
  stdDev: number;
}

interface CalibrationData {
  paperRgb: [number, number, number];
  skinRgb: [number, number, number];
  skinStdDev?: number;
  regions?: Partial<Record<"forehead" | "nose" | "cheekL" | "cheekR" | "chin", RegionSample>>;
  lighting?: {
    brightness: number;
    warmthBias: number;
    paperUniformity: number;
    sharpness: number;
  };
  gains: [number, number, number];
  confidence: number;
}

export class InternalAdapter implements AnalysisProvider {
  readonly name = "mock" as const;
  readonly version = "internal-2.0.0";

  async analyzeSkin(image: ImageInput, _ctx: UserContext): Promise<SkinAnalysisResult> {
    const calib = parseCalibration(image);
    const corrected = applyWB(calib.skinRgb, calib.gains);

    // Per-region corrected RGB (for region-aware redness)
    const regionsCorrected = {
      forehead: calib.regions?.forehead ? applyWB(calib.regions.forehead.mean, calib.gains) : null,
      nose:     calib.regions?.nose     ? applyWB(calib.regions.nose.mean, calib.gains) : null,
      cheekL:   calib.regions?.cheekL   ? applyWB(calib.regions.cheekL.mean, calib.gains) : null,
      cheekR:   calib.regions?.cheekR   ? applyWB(calib.regions.cheekR.mean, calib.gains) : null,
      chin:     calib.regions?.chin     ? applyWB(calib.regions.chin.mean, calib.gains) : null,
    };

    const { lightness, saturation } = rgbToHsl(corrected);
    const depth = classifyDepth(lightness);

    // ── Redness — region-aware ──────────────────────────────────────
    const redness = analyzeRedness(corrected, regionsCorrected);

    // ── Undertone — with confidence damping ─────────────────────────
    const undertoneResult = classifyUndertone(corrected, calib.lighting, redness.score);

    // ── Glow / radiance ─────────────────────────────────────────────
    const glowRaw = clamp01(lightness * 0.65 + saturation * 0.35);
    const glowScore = Math.round(glowRaw * 100);

    // ── Evenness — proxied by std-dev across skin + cross-region variance ──
    const evennessRaw = estimateEvenness(calib, regionsCorrected);
    const evennessScore = Math.round(evennessRaw * 100);

    // Dryness from image alone: we don't reliably measure it. Score is null
    // unless we get future ML signal; keep a low conservative value.
    const drynessScore = 0;
    const drynessConfidence: ConfidenceLevel = "low";

    const scores = {
      redness: redness.score,
      glow: glowScore,
      evenness: evennessScore,
      dryness: drynessScore,
    };

    // ── Confidence per dimension ────────────────────────────────────
    const lightingPenalty = computeLightingPenalty(calib);
    const baseConf = calib.confidence * (1 - lightingPenalty);
    const overallConf = qualifyConfidence(baseConf);

    const rednessConf = qualifyConfidence(baseConf * redness.confidenceMul);
    const evennessConf = qualifyConfidence(baseConf * 0.7); // evenness without ML is approximate

    const confidence = {
      overall: overallConf,
      redness: rednessConf,
      undertone: undertoneResult.confidence,
      dryness: drynessConfidence,
      evenness: evennessConf,
    };

    // ── Lighting context for the UI ─────────────────────────────────
    const lightingQuality = describeLighting(calib);

    // ── Concerns ranked ─────────────────────────────────────────────
    const ranked = rankConcerns(scores, redness, confidence);
    const primaryConcern = ranked[0]?.key ?? "balanced";
    const secondaryConcerns = ranked.slice(1, 3).map((c) => c.key);
    const lowPriorityConcerns = ranked.slice(3).map((c) => c.key);

    // ── Observations / Interpretations / Recommendations ────────────
    const observations = buildObservations(depth, undertoneResult.label, redness, lightingQuality);
    const interpretations = buildInterpretations(scores, redness, undertoneResult, confidence);
    const recommendations = buildRecommendations(scores, redness, undertoneResult);

    const scoreRationale: Record<string, string> = {
      redness: redness.rationale,
      glow: `Hudens egen luminans og fargemetning, ujustert for makeup`,
      evenness: `Fargevariasjon over ansiktet — påvirkes av lys og skygger`,
      dryness: `Tørrhet kan ikke leses pålitelig fra ett bilde — bruk hudloggen din for trend`,
    };

    // Legacy 0..1 metrics — kept for backward compat
    const metrics = {
      hydration: 0.5,
      oiliness: 0.5,
      redness: scores.redness / 100,
      evenness: scores.evenness / 100,
      smoothness: 0.5,
      radiance: scores.glow / 100,
      poreVisibility: 0.5,
      sensitivityIndicators: scores.redness >= 70 ? 0.7 : scores.redness >= 50 ? 0.5 : 0.3,
    };

    // Legacy concerns array — same data, different shape
    const concerns: SkinAnalysisResult["concerns"] = ranked.map((c) => ({
      key: c.key,
      severity: c.severity / 100,
      confidence: c.confidence,
    }));

    return {
      engine: "mock",
      engineVersion: this.version,
      scores,
      confidence,
      lightingQuality,
      primaryConcern,
      secondaryConcerns,
      lowPriorityConcerns,
      scoreRationale,
      observations,
      interpretations,
      recommendations,
      metrics,
      concerns,
      raw: {
        calibration: calib,
        correctedSkinRgb: corrected,
        undertone: undertoneResult.label,
        depth,
        rednessPattern: redness.pattern,
        rednessByRegion: redness.byRegion,
      },
    };
  }

  async matchFoundation(image: ImageInput, _ctx: UserContext): Promise<ShadeMatch[]> {
    const calib = parseCalibration(image);
    const corrected = applyWB(calib.skinRgb, calib.gains);
    const undertone = classifyUndertone(corrected, calib.lighting, 0);
    const depth = classifyDepth(rgbToHsl(corrected).lightness);

    return [
      {
        brand: "Toneup Edit",
        productName: "Brume Velours Foundation",
        shadeName: shadeNameFor(undertone.label, depth),
        hexColor: rgbToHex(corrected),
        matchScore: calib.confidence,
        reason: `${undertone.label} undertone, ${depth} depth`,
      },
    ];
  }

  async recommendProducts(
    _ctx: UserContext,
    _category: ProductCategory
  ): Promise<ProductSuggestion[]> {
    return [];
  }
}

// ============================================================
// REDNESS — region-aware
// ============================================================

interface RednessAnalysis {
  /** 0–100 priority score */
  score: number;
  /** Whole-face fallback severity 0..1 */
  severity: number;
  /** Pattern across face */
  pattern: RednessPattern;
  /** Per-region severity 0..1 */
  byRegion: Record<string, number>;
  /** Regions with notably elevated redness */
  regions: string[];
  /** Confidence multiplier (0..1) */
  confidenceMul: number;
  /** Short why-line for UI */
  rationale: string;
}

function analyzeRedness(
  faceRgb: [number, number, number],
  byRegion: Record<string, [number, number, number] | null>
): RednessAnalysis {
  const facewide = rednessIndex(faceRgb);

  const perRegion: Record<string, number> = {};
  for (const [name, rgb] of Object.entries(byRegion)) {
    if (!rgb) continue;
    perRegion[name] = rednessIndex(rgb);
  }

  const values = Object.values(perRegion);
  const haveRegions = values.length >= 3;

  let pattern: RednessPattern = "none";
  let regions: string[] = [];
  let score = Math.round(facewide * 100);
  let confidenceMul = 0.85;
  let rationale = "Mål basert på hele ansiktsområdet";

  if (haveRegions) {
    confidenceMul = 1.0;
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const max = Math.max(...values);
    const elevated = Object.entries(perRegion).filter(
      ([, v]) => v >= 0.5 || v >= avg + 0.15
    ).map(([k]) => k);

    if (max < 0.35) {
      pattern = "none";
    } else if (elevated.length >= 4) {
      pattern = "diffuse";
    } else if (
      elevated.includes("nose") &&
      (elevated.includes("cheekL") || elevated.includes("cheekR")) &&
      !elevated.includes("forehead")
    ) {
      pattern = "central";
    } else if (
      (elevated.includes("cheekL") || elevated.includes("cheekR")) &&
      !elevated.includes("nose")
    ) {
      pattern = "cheeks";
    } else if (elevated.length <= 2) {
      pattern = "local";
    } else {
      pattern = "diffuse";
    }
    regions = elevated;

    // Score: emphasize the worst region but average in the rest
    const aggregate = 0.6 * max + 0.4 * avg;
    score = Math.round(aggregate * 100);

    rationale =
      pattern === "diffuse"
        ? "Forhøyet rødhet sees i flere områder samtidig"
        : pattern === "central"
        ? "Rødhet konsentrert rundt nese og kinn"
        : pattern === "cheeks"
        ? "Rødhet primært på kinn"
        : pattern === "local"
        ? "Lokal rødhet i avgrensede områder"
        : "Lav rødhet over hele ansiktet";
  }

  return {
    score: Math.min(100, score),
    severity: score / 100,
    pattern,
    byRegion: perRegion,
    regions,
    confidenceMul,
    rationale,
  };
}

function rednessIndex(rgb: [number, number, number]): number {
  // Two complementary signals:
  //  - R/B ratio: yellow/warm light raises this; pure redness raises it more
  //  - R relative to G: real redness pushes R above G too
  const [r, g, b] = rgb;
  const rbRatio = r / Math.max(1, b);
  const rgGap = (r - g) / Math.max(1, r);
  const fromRb = clamp01((rbRatio - 1.05) / 0.55);
  const fromRg = clamp01(rgGap / 0.25);
  // Average — penalises pure-warm-light false positives
  return clamp01(0.5 * fromRb + 0.5 * fromRg);
}

// ============================================================
// UNDERTONE — with confidence
// ============================================================

interface UndertoneResult {
  label: Undertone;
  confidence: ConfidenceLevel;
}

function classifyUndertone(
  rgb: [number, number, number],
  lighting: CalibrationData["lighting"],
  rednessScore: number
): UndertoneResult {
  const [r, g, b] = rgb;
  const rb = r / Math.max(1, b);
  const olive = g / Math.max(1, (r + b) / 2);

  let label: Undertone;
  if (olive > 1.02) {
    label = "olive";
  } else if (rb > 1.14) {
    label = "warm";
  } else if (rb < 1.02) {
    label = "cool";
  } else {
    label = "neutral";
  }

  // Downgrade confidence when light is warm or analysis was disturbed
  const warm = lighting?.warmthBias ?? 0;
  const sharp = lighting?.sharpness ?? 0.5;
  const bright = lighting?.brightness ?? 0.5;

  let conf: ConfidenceLevel;
  if (warm > 0.5) {
    // Indoor warm light biases toward "warm" — be honest
    label = label === "warm" ? "likely-warm-neutral" : label;
    conf = "low";
  } else if (warm > 0.35 || bright < 0.45 || sharp < 0.3 || rednessScore >= 70) {
    conf = "medium-low";
  } else if (bright < 0.55 || sharp < 0.4) {
    conf = "medium";
  } else {
    conf = "high";
  }

  // If confidence is "low" and label still looks committed, soften to uncertain
  if (conf === "low" && warm > 0.6) {
    label = "uncertain";
  }

  return { label, confidence: conf };
}

// ============================================================
// LIGHTING
// ============================================================

function computeLightingPenalty(calib: CalibrationData): number {
  if (!calib.lighting) return 0.2;
  const { brightness, warmthBias, sharpness, paperUniformity } = calib.lighting;
  let penalty = 0;
  if (brightness < 0.4) penalty += 0.25;
  else if (brightness < 0.55) penalty += 0.1;
  if (warmthBias > 0.5) penalty += 0.25;
  else if (warmthBias > 0.35) penalty += 0.1;
  if (sharpness < 0.25) penalty += 0.25;
  else if (sharpness < 0.4) penalty += 0.1;
  if (paperUniformity > 30) penalty += 0.1;
  return Math.min(0.7, penalty);
}

function describeLighting(calib: CalibrationData): NonNullable<SkinAnalysisResult["lightingQuality"]> {
  const notes: string[] = [];
  const l = calib.lighting;
  if (!l) {
    return { overall: "unknown", warmthBias: 0, brightness: 0, notes: ["Lyset er ikke målt"] };
  }
  let overall: NonNullable<SkinAnalysisResult["lightingQuality"]>["overall"] = "good";
  if (l.brightness < 0.45) {
    overall = "dim";
    notes.push("Lyset er noe dimt — undertone og glød er usikre");
  }
  if (l.warmthBias > 0.5) {
    overall = "warm";
    notes.push("Bildelyset er varmt og påvirker undertone-vurderingen");
  } else if (l.warmthBias > 0.35) {
    notes.push("Lyset er litt varmt — undertone er noe usikker");
  }
  if (l.sharpness < 0.3) {
    overall = "uneven";
    notes.push("Bildet er noe uskarpt — fine detaljer leses ikke");
  }
  if (l.paperUniformity > 30) {
    notes.push("Hvitarket varierer i lys — kalibreringen er omtrentlig");
  }
  return {
    overall,
    warmthBias: round2(l.warmthBias),
    brightness: round2(l.brightness),
    notes,
  };
}

// ============================================================
// CONCERN RANKING
// ============================================================

interface RankedConcern {
  key: string;
  severity: number;     // 0..100
  confidence: number;   // 0..1
}

function rankConcerns(
  scores: { redness: number; glow: number; evenness: number; dryness: number },
  redness: RednessAnalysis,
  confidence: NonNullable<SkinAnalysisResult["confidence"]>
): RankedConcern[] {
  const out: RankedConcern[] = [];

  if (scores.redness >= 50) {
    const key =
      redness.pattern === "diffuse" || scores.redness >= 75
        ? "redness_sensitivity"
        : redness.pattern === "central"
        ? "central_redness"
        : "redness";
    out.push({
      key,
      severity: scores.redness,
      confidence: confidenceToNumber(confidence.redness),
    });
  }

  if (scores.glow < 45) {
    out.push({
      key: "dullness",
      severity: 100 - scores.glow,
      confidence: confidenceToNumber(confidence.overall),
    });
  }

  if (scores.evenness < 50) {
    out.push({
      key: "uneven_tone",
      severity: 100 - scores.evenness,
      confidence: confidenceToNumber(confidence.evenness),
    });
  }

  if (out.length === 0) {
    out.push({
      key: "balanced",
      severity: 30,
      confidence: confidenceToNumber(confidence.overall),
    });
  }

  out.sort((a, b) => b.severity * (0.5 + 0.5 * b.confidence) - a.severity * (0.5 + 0.5 * a.confidence));
  return out;
}

// ============================================================
// NARRATIVE BUILDERS — Norwegian
// ============================================================

function buildObservations(
  depth: string,
  undertone: Undertone,
  redness: RednessAnalysis,
  lighting: NonNullable<SkinAnalysisResult["lightingQuality"]>
): string[] {
  const out: string[] = [];

  out.push(
    `Hudtonen fremstår ${depthLabel(depth)} med ${undertoneShort(undertone)} undertone`
  );

  if (redness.pattern === "diffuse") {
    out.push("Forhøyet rødhet sees over store deler av ansiktet");
  } else if (redness.pattern === "central") {
    out.push("Synlig rødhet konsentrert rundt nese og sentralt ansikt");
  } else if (redness.pattern === "cheeks") {
    out.push("Rødhet primært på kinnene");
  } else if (redness.pattern === "local" && redness.regions.length) {
    out.push(`Lokal rødhet i ${redness.regions.map(regionLabel).join(" og ")}`);
  } else if (redness.pattern === "none") {
    out.push("Lav generell rødhet — hudtonen er stort sett jevn");
  }

  if (lighting.warmthBias > 0.4) {
    out.push("Bildelyset er varmt og påvirker undertone-vurderingen");
  }
  if (lighting.brightness < 0.45) {
    out.push("Lyset er dimt — analysen er noe usikker");
  }

  return out;
}

function buildInterpretations(
  scores: { redness: number; glow: number; evenness: number; dryness: number },
  redness: RednessAnalysis,
  undertone: UndertoneResult,
  confidence: NonNullable<SkinAnalysisResult["confidence"]>
): string[] {
  const out: string[] = [];

  if (scores.redness >= 65 && redness.pattern === "diffuse") {
    out.push("Mønsteret kan tyde på sensitivitet eller midlertidig barriereirritasjon");
  } else if (scores.redness >= 65 && redness.pattern === "central") {
    out.push("Sentral rødhet kan være hormonell eller sol-relatert, men kan også indikere rosacea-tendens — følg med over tid");
  } else if (scores.redness >= 50 && redness.pattern === "cheeks") {
    out.push("Rødhet på kinnene kan komme av kulde, varmt vann eller mild irritasjon");
  }

  if (scores.glow < 40) {
    out.push("Lav glød skyldes ofte dehydrering, søvnmangel eller oppbygging av døde hudceller");
  }

  if (scores.evenness < 45) {
    out.push("Ujevn hudtone tar tid å jevne ut — det krever konsistens, ikke aggressive ingredienser");
  }

  out.push("Tørrhet kan ikke bekreftes sikkert fra bildet alene — bruk hudloggen din for å spore det over tid");

  if (undertone.confidence === "low" || undertone.confidence === "medium-low") {
    out.push("Foundation-undertonen bør verifiseres i nøytralt dagslys før kjøp");
  }
  if (confidence.overall === "low") {
    out.push("Generell analyse-tillit er lav i dette bildet — ta gjerne en ny i bedre lys");
  }

  return out;
}

function buildRecommendations(
  scores: { redness: number; glow: number; evenness: number; dryness: number },
  redness: RednessAnalysis,
  undertone: UndertoneResult
): string[] {
  const out: string[] = [];

  // ── Redness — graded by pattern + severity ──────────────────────
  if (scores.redness >= 60) {
    if (redness.pattern === "diffuse") {
      out.push(
        "Pause aktive syrer og retinol mens rødheten er høy — barrieren trenger ro"
      );
      out.push(
        "Niacinamid 5-10% morgen og kveld reduserer både rødhet og styrker barrieren"
      );
      out.push(
        "Bytt til parfymefri rens med pH 5-6 (f.eks. ceramidrens eller mild gel)"
      );
      out.push(
        "Mineral-SPF med zinkoksid er mildere enn kjemisk SPF når huden er reaktiv"
      );
    } else if (redness.pattern === "central") {
      out.push(
        "Azelaic acid 10-15% er det best dokumenterte valget mot sentral rødhet"
      );
      out.push(
        "Grønnbasert primer eller concealer nøytraliserer rødhet visuelt før foundation"
      );
      out.push(
        "Unngå varmt vann og krydret mat når du er i en rødhets-fase"
      );
      out.push("Daglig SPF 30+ er ikke valgfritt — UV forverrer sentral rødhet over tid");
    } else {
      out.push("Lokal niacinamid og kjølige kompresser i 2-3 dager");
      out.push("Hopp over eksfoliering denne uka — la barrieren stabilisere seg");
    }
  } else if (scores.redness >= 40) {
    out.push("Hold rutinen mild denne uka — ingen nye aktiver");
    out.push("Vurder en barrierestøttende krem med ceramider eller centella");
  }

  // ── Glow — only when redness isn't competing for priority ───────
  if (scores.glow < 45 && scores.redness < 55) {
    out.push("Hyaluronsyre-serum (Hada Labo, The Ordinary HA 2% + B5) på fuktig hud morgen og kveld");
    if (scores.redness < 35) {
      out.push("Vitamin C 10-15% L-ascorbic acid om morgenen løfter glød på 4-6 uker");
    } else {
      out.push("Mild vitamin C-derivat (MAP, SAP) er tryggere enn L-ascorbic når huden er reaktiv");
    }
  }

  // ── Evenness ────────────────────────────────────────────────────
  if (scores.evenness < 50 && scores.redness < 55) {
    out.push("Niacinamid 5-10% jevner pigment uten å irritere — gi det 8-12 uker");
    if (scores.evenness < 35) {
      out.push("Alpha arbutin 2% eller tranexamic acid for hyperpigmentering");
    }
  }

  // ── Dehydration / dullness combo ────────────────────────────────
  if (scores.glow < 40 && scores.evenness < 50) {
    out.push("Hyaluronsyre hydratiserer; ceramider og shea-butter LÅSER fukten inne — bruk begge i rekkefølge");
  }

  // ── Foundation guidance — confidence-aware ──────────────────────
  if (
    undertone.confidence === "high" &&
    undertone.label !== "uncertain" &&
    undertone.label !== "likely-warm-neutral"
  ) {
    const kw = foundationKeywords(undertone.label).slice(0, 4).join(", ");
    out.push(
      `Foundation: se etter ${undertoneShort(undertone.label)} undertone — søk på shade-navn som ${kw}`
    );
  } else if (undertone.confidence === "medium" || undertone.confidence === "medium-low") {
    out.push(
      "Foundation: bekreft undertonen i dagslys før kjøp — test gjerne to nyanser ved siden av hverandre"
    );
  } else {
    out.push(
      "Foundation: ta en ny analyse i nøytralt dagslys før du satser på en bestemt undertone"
    );
  }

  return out;
}

/**
 * Per-concern paragraph advice — used by the result UI alongside the
 * compact recommendations list. More room for nuance and ingredient
 * specifics here.
 */
export function concernAdvice(key: string, skinType?: string): string {
  const m: Record<string, string> = {
    redness_sensitivity:
      skinType === "sensitive"
        ? "Med sensitiv hud og høy rødhet bør du pause alle syrer og retinol til barrieren stabiliserer seg. Niacinamid, panthenol og centella er dokumentert beroligende. Skift også til parfymefri rens."
        : "Sensitivitet og rødhet samtidig peker mot barriereirritasjon. Drop aktiver i 1-2 uker, bruk en ceramidrik krem morgen og kveld, og hold rutinen så enkel som mulig.",
    central_redness:
      "Sentral rødhet (nese, kinn) er ofte sol-relatert eller en rosacea-tendens. Azelaic acid 10-15% er gullstandarden. Bruk mineral-SPF daglig, unngå varmt vann og krydret mat i flare-ups.",
    redness:
      "Rødhet kan dempes med niacinamid-serum, grønn primer eller grønnbeige concealer. Unngå varmt vann og kraftig eksfoliering mens den er forhøyet.",
    uneven_tone:
      "Regelmessig vitamin C-serum om morgenen og mild AHA-eksfoliering 2-3 ganger i uken om kvelden jevner ut hudtonen over 8-12 uker. Konsistens viktigere enn høye konsentrasjoner.",
    dullness:
      "Matt hud responderer godt på hyaluronsyre, glyserin og lette olje-hybrider. Vitamin C på morgenen, en mild eksfoliant 1-2 ganger i uka, og nok søvn. Fuktighet er første prioritet.",
    dehydration:
      "Hydrering (hyaluronsyre, glyserin) og fuktlåsing (ceramider, shea-butter) er to forskjellige ting — du trenger begge. Hydrerende serum først, deretter en rikere krem.",
    breakout:
      "Salicylsyre (BHA) 2% er det beste OTC-alternativet for porene. Ren niacinamid 5-10% reduserer sebum-produksjon og rødhet rundt urenheter. Adapalene 0.1% over disk er sterkere hvis det går igjen.",
    balanced:
      "Huden er i god balanse. Hold rutinen enkel, ikke endre noe som funker. Logg hva du gjør — det er verdt å huske til neste gang.",
  };
  return m[key] ?? "Spør rådgiveren for tilpassede råd.";
}

/**
 * Foundation shade-name keywords by undertone — used to surface concrete
 * search terms in the result UI.
 */
export function foundationKeywords(u: Undertone): string[] {
  if (u === "warm") return ["Golden", "Warm", "Beige", "Peach", "Doré", "Noisette", "Honey"];
  if (u === "cool") return ["Cool", "Pink", "Rosy", "Porcelain", "Rosé", "Ivory"];
  if (u === "olive") return ["Olive", "Sand", "Neutral-Olive", "Sable"];
  if (u === "likely-warm-neutral") return ["Neutral", "Warm-Neutral", "Beige", "Sand"];
  if (u === "uncertain") return ["Neutral", "Nude", "Beige"];
  return ["Neutral", "Nude", "Beige", "Natural", "Sand"];
}

// ============================================================
// HELPERS
// ============================================================

function parseCalibration(image: ImageInput): CalibrationData {
  if (typeof image.source === "string" && image.source.startsWith("{")) {
    try {
      const data = JSON.parse(image.source);
      const gains = computeGains(data.paperRgb);
      return {
        ...data,
        gains,
        confidence: data.confidence ?? 0.8,
      };
    } catch {
      // fall through
    }
  }
  return {
    paperRgb: [255, 255, 255],
    skinRgb: [200, 170, 150],
    gains: [1, 1, 1],
    confidence: 0.3,
  };
}

function computeGains(paperRgb: [number, number, number]): [number, number, number] {
  const [r, g, b] = paperRgb;
  const target = Math.max(r, g, b);
  return [target / r, target / g, target / b];
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
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      case bn: h = ((rn - gn) / d + 4) / 6; break;
    }
  }
  return { hue: h * 360, saturation: s, lightness: l };
}

function classifyDepth(lightness: number): "fair" | "light" | "medium" | "tan" | "deep" {
  if (lightness > 0.78) return "fair";
  if (lightness > 0.65) return "light";
  if (lightness > 0.50) return "medium";
  if (lightness > 0.35) return "tan";
  return "deep";
}

function estimateEvenness(
  calib: CalibrationData,
  regions: Record<string, [number, number, number] | null>
): number {
  const present = Object.values(regions).filter((v): v is [number, number, number] => v !== null);
  if (present.length < 3) {
    if (calib.skinStdDev == null) return 0.6;
    // Higher std-dev → less even. Empirical normalization.
    return clamp01(1 - calib.skinStdDev / 35);
  }
  // Variance across region means (R channel proxy)
  const rs = present.map((p) => p[0]);
  const mean = rs.reduce((a, b) => a + b, 0) / rs.length;
  const variance = rs.reduce((a, b) => a + (b - mean) ** 2, 0) / rs.length;
  const std = Math.sqrt(variance);
  // 0 std → perfectly even (1.0), 25 std → quite uneven (~0)
  return clamp01(1 - std / 25);
}

function qualifyConfidence(c: number): ConfidenceLevel {
  if (c >= 0.75) return "high";
  if (c >= 0.55) return "medium";
  if (c >= 0.35) return "medium-low";
  return "low";
}

function confidenceToNumber(c: ConfidenceLevel): number {
  return { high: 0.9, medium: 0.7, "medium-low": 0.5, low: 0.3 }[c];
}

function depthLabel(d: string): string {
  return ({
    fair: "lys", light: "lys-medium", medium: "medium", tan: "tan", deep: "dyp",
  } as Record<string, string>)[d] ?? d;
}

function undertoneShort(u: Undertone): string {
  return ({
    warm: "varm", cool: "kjølig", neutral: "nøytral", olive: "oliven",
    "likely-warm-neutral": "varm-nøytral (usikker)", uncertain: "usikker",
  } as Record<string, string>)[u] ?? u;
}

function regionLabel(r: string): string {
  return ({
    forehead: "panne", nose: "nese", cheekL: "venstre kinn",
    cheekR: "høyre kinn", chin: "hake",
  } as Record<string, string>)[r] ?? r;
}

function shadeNameFor(undertone: string, depth: string): string {
  const warmth =
    undertone === "warm" ? "doré"
    : undertone === "cool" ? "rosé"
    : undertone === "olive" ? "olive"
    : "neutre";
  const depthFr =
    depth === "fair" ? "porcelaine"
    : depth === "light" ? "ivoire"
    : depth === "medium" ? "sable"
    : depth === "tan" ? "noisette"
    : "terre cuite";
  return `${depthFr} ${warmth}`;
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
