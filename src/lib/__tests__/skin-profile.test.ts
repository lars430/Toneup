/**
 * skin-profile heuristic tests
 *
 * Four mock profiles verifying that the heuristic correctly separates
 * visible_pinkness (natural cast) from surface_redness (zone deviation),
 * handles East Asian undertones without false redness, and penalises
 * confidence when stable reference regions are missing.
 */

import { describe, it, expect } from "vitest";
import { analyzeFromCalibration } from "../skin-profile";
import type { CalibrationInput, Level } from "../skin-profile";

// ── helpers ────────────────────────────────────────────────────────────────

/** A neutral-grey paper means WB gains ≈ 1 — corrected values ≈ raw values. */
const NEUTRAL_PAPER: [number, number, number] = [235, 235, 235];

const GOOD_LIGHTING: CalibrationInput["lighting"] = {
  brightness: 0.72,
  warmthBias: 0.12,
  paperUniformity: 8,
  sharpness: 0.78,
};

function region(mean: [number, number, number], stdDev = 4) {
  return { mean, stdDev };
}

function levelAtLeast(a: Level, b: Level): boolean {
  const order: Level[] = ["none", "low", "medium", "high"];
  return order.indexOf(a) >= order.indexOf(b);
}

// ── Scenario 1 ─────────────────────────────────────────────────────────────
// Fair/light Nordic skin — natural even pink cast, no zone redness.
// All facial zones are nearly identical → the pinkness is uniform, not localised.
//
// Expected:
//   visible_pinkness = "medium"    (natural cool/pink cast IS present)
//   surface_redness  = "none"|"low" (no localised flush — not a skin problem)
//   redness_type     = "natural_pinkness"|"none"

describe("Scenario 1 — Fair Nordic, even pinkness, no zone redness", () => {
  const BASE_RGB: [number, number, number] = [208, 175, 166];

  const input: CalibrationInput = {
    paperRgb: NEUTRAL_PAPER,
    skinRgb: [210, 177, 168],
    regions: {
      forehead: region([208, 175, 166]),
      templeL:  region([207, 174, 165]),
      templeR:  region([207, 174, 165]),
      jawline:  region([206, 173, 164]),
      // Nose and cheeks are nearly identical to the base — no elevation.
      nose:   region([210, 175, 166], 5),
      cheekL: region([210, 176, 167]),
      cheekR: region([210, 176, 167]),
      chin:   region([208, 175, 166]),
    },
    lighting: GOOD_LIGHTING,
    confidence: 0.88,
  };

  const result = analyzeFromCalibration(input);

  it("skin_depth is fair, fair_light, or light (not medium or darker)", () => {
    expect(["fair", "fair_light", "light"]).toContain(result.skin_depth);
  });

  it("visible_pinkness is medium (natural pink cast is present)", () => {
    expect(result.visible_pinkness).toBe("medium");
  });

  it("surface_redness is none or low (no localised flush zone)", () => {
    expect(["none", "low"]).toContain(result.surface_redness);
  });

  it("surface_redness is NOT medium or high", () => {
    expect(result.surface_redness).not.toBe("medium");
    expect(result.surface_redness).not.toBe("high");
  });

  it("redness_type is natural_pinkness or none", () => {
    expect(["natural_pinkness", "none"]).toContain(result.redness_type);
  });

  it("no redness regions flagged", () => {
    expect(result.redness_regions).toHaveLength(0);
  });

  it("white_balance_status is corrected (neutral paper)", () => {
    expect(result.white_balance_status).toBe("corrected");
  });

  it("confidence is reasonable (> 0.55)", () => {
    expect(result.confidence).toBeGreaterThan(0.55);
  });
});

// ── Scenario 2 ─────────────────────────────────────────────────────────────
// Fair/light Nordic skin with clear redness around nose and cheeks.
// Same base skin as scenario 1 — but nose and cheeks are significantly more red.
//
// Expected:
//   visible_pinkness = "medium"           (base still pink)
//   surface_redness  = "medium" | "high"  (localised zone flush IS present)
//   redness_regions  includes nose / central_cheeks

describe("Scenario 2 — Fair Nordic with localised nose/cheek redness", () => {
  const input: CalibrationInput = {
    paperRgb: NEUTRAL_PAPER,
    skinRgb: [212, 178, 168],
    regions: {
      forehead: region([208, 175, 166]),
      templeL:  region([207, 174, 165]),
      templeR:  region([207, 174, 165]),
      jawline:  region([206, 173, 164]),
      // Nose clearly redder — large positive Lab a* deviation from base.
      nose:   region([225, 160, 153], 6),
      // Cheeks also elevated — enough to cross the zone threshold.
      cheekL: region([216, 162, 152], 5),
      cheekR: region([216, 162, 152], 5),
      chin:   region([207, 174, 165]),
    },
    lighting: GOOD_LIGHTING,
    confidence: 0.88,
  };

  const result = analyzeFromCalibration(input);

  it("skin_depth is still fair/light (redness does not push depth darker)", () => {
    expect(["fair", "fair_light", "light"]).toContain(result.skin_depth);
  });

  it("visible_pinkness is still present (base cast unchanged)", () => {
    expect(["low", "medium", "high"]).toContain(result.visible_pinkness);
  });

  it("surface_redness is medium or high (localised flush detected)", () => {
    expect(levelAtLeast(result.surface_redness, "medium")).toBe(true);
  });

  it("redness_regions includes nose and/or central_cheeks", () => {
    const hasZone =
      result.redness_regions.includes("nose") ||
      result.redness_regions.includes("central_cheeks");
    expect(hasZone).toBe(true);
  });

  it("redness_type is flush, irritation, or rosacea_like (not natural_pinkness)", () => {
    expect(["flush", "irritation", "rosacea_like"]).toContain(result.redness_type);
  });

  it("redness_confidence is reasonable (>= 0.5)", () => {
    expect(result.redness_confidence).toBeGreaterThanOrEqual(0.5);
  });
});

// ── Scenario 3 ─────────────────────────────────────────────────────────────
// East Asian / Chinese skin — light to light_medium, neutral-warm / yellow-olive
// undertone, little redness.  The algorithm must NOT misclassify the yellow tone
// as "redness high", and must NOT return undertone "cool".
//
// RGB chosen so that r/b ≈ 1.11 → neutral_warm (not "warm", not "cool").
// All zones similar to base → no surface redness.
//
// Expected:
//   surface_redness  = "none"|"low"
//   visible_pinkness = "none"|"low"   (yellow cast, not pink)
//   undertone        = "neutral_warm"|"warm"|"olive"  (NOT "cool")
//   legacy_undertone ≠ "cool"

describe("Scenario 3 — East Asian light skin, neutral-warm undertone, no redness", () => {
  const EAST_ASIAN_BASE: [number, number, number] = [162, 148, 145];

  const input: CalibrationInput = {
    paperRgb: NEUTRAL_PAPER,
    skinRgb: [163, 149, 146],
    regions: {
      forehead: region([162, 148, 145]),
      templeL:  region([161, 147, 144]),
      templeR:  region([161, 147, 144]),
      jawline:  region([160, 147, 144]),
      // All redness zones virtually identical to base — no elevation.
      nose:   region([163, 148, 145], 4),
      cheekL: region([163, 149, 146]),
      cheekR: region([163, 149, 146]),
      chin:   region([162, 147, 144]),
    },
    lighting: { ...GOOD_LIGHTING, warmthBias: 0.15 },
    confidence: 0.85,
  };

  const result = analyzeFromCalibration(input);

  it("skin_depth is light or light_medium (not deep or tan)", () => {
    expect(["fair", "fair_light", "light", "light_medium"]).toContain(result.skin_depth);
  });

  it("surface_redness is none or low (no redness misclassified from yellow tone)", () => {
    expect(["none", "low"]).toContain(result.surface_redness);
  });

  it("surface_redness is NOT medium or high", () => {
    expect(result.surface_redness).not.toBe("medium");
    expect(result.surface_redness).not.toBe("high");
  });

  it("visible_pinkness is none or low (yellow skin is not pink)", () => {
    expect(["none", "low"]).toContain(result.visible_pinkness);
  });

  it("undertone is warm-family, not cool", () => {
    expect(["neutral_warm", "warm", "neutral", "olive"]).toContain(result.undertone);
  });

  it("legacy_undertone is NOT cool", () => {
    expect(result.legacy_undertone).not.toBe("cool");
  });

  it("no redness regions flagged", () => {
    expect(result.redness_regions).toHaveLength(0);
  });
});

// ── Scenario 4 ─────────────────────────────────────────────────────────────
// Medium/tan skin — redness is subtler and threshold-relative (not absolute RGB).
// Only one stable base region is provided (forehead) to simulate a difficult capture
// where the algorithm lacks enough reference points.
//
// Expected:
//   skin_depth  = "medium"|"tan"
//   confidence  < 0.75       (penalised because stableWeights.length < 2)
//   surface_redness is assessed relative to base, not absolute RGB values

describe("Scenario 4 — Medium/tan skin, missing reference regions → lower confidence", () => {
  // Neutral paper, slight warm bias
  // Sparse input: only forehead from BASE_REGIONS + nose/chin as redness zones.
  // cheekL/cheekR intentionally omitted — they are added to stableWeights when
  // present and not elevated, which would prevent the face_fallback path.
  // Sparse input: only forehead from BASE_REGIONS.
  // chin would also be added to stableWeights (it has its own stable-weight slot),
  // so we omit it. nose is a pure redness zone and does NOT contribute to stableWeights.
  const input: CalibrationInput = {
    paperRgb: [230, 228, 225],
    skinRgb: [148, 108, 90],
    regions: {
      forehead: region([148, 108, 90], 8),
      nose:     region([152, 107, 86], 6),
    },
    lighting: { brightness: 0.65, warmthBias: 0.22, paperUniformity: 10, sharpness: 0.70 },
    confidence: 0.88,
  };

  const result = analyzeFromCalibration(input);

  // Full-region version for the confidence comparison.
  // cheekL/cheekR are also added to stableWeights when not elevated,
  // so we omit them from the sparse input and include them here.
  const inputFull: CalibrationInput = {
    ...input,
    regions: {
      ...input.regions,
      templeL: region([147, 107, 89]),
      templeR: region([147, 107, 89]),
      jawline:  region([146, 107, 88]),
      cheekL:   region([149, 108, 89]),
      cheekR:   region([149, 108, 89]),
    },
  };
  const resultFull = analyzeFromCalibration(inputFull);

  it("skin_depth is medium or tan", () => {
    expect(["medium", "tan"]).toContain(result.skin_depth);
  });

  it("confidence is lower than 0.75 when only one stable region is available", () => {
    expect(result.confidence).toBeLessThan(0.75);
  });

  it("confidence is higher when all base regions are provided", () => {
    expect(resultFull.confidence).toBeGreaterThan(result.confidence);
  });

  it("sampled_regions falls back to face_fallback when fewer than 2 stable regions", () => {
    expect(result.sampled_regions).toContain("face_fallback");
  });

  it("surface_redness is none or low (subtle redness — not absolute red shift)", () => {
    expect(["none", "low"]).toContain(result.surface_redness);
  });

  it("redness uses relative deviation, not absolute — no false high redness", () => {
    expect(result.surface_redness).not.toBe("high");
  });
});
