/**
 * MockAdapter — realistiske dummy-data mens vi venter på Revieve.
 *
 * Returnerer deterministiske resultater basert på userId hash,
 * så samme bruker får konsistente "analyser" på tvers av økter.
 */

import type {
  AnalysisProvider,
  ImageInput,
  UserContext,
  SkinAnalysisResult,
  ShadeMatch,
  ProductSuggestion,
} from "./types";
import type { ProductCategory } from "@/types/domain";

function hashToFloat(seed: string, salt: string): number {
  let h = 2166136261;
  const s = seed + salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % 1000) / 1000;
}

export class MockAdapter implements AnalysisProvider {
  readonly name = "mock" as const;
  readonly version = "0.1.0";

  async analyzeSkin(_image: ImageInput, ctx: UserContext): Promise<SkinAnalysisResult> {
    await new Promise((r) => setTimeout(r, 800)); // simulate latency

    const h = (k: string) => hashToFloat(ctx.userId, k);

    // Bias metrics by stated skin type so mock feels plausible
    const dryBias = ctx.skinType === "dry" ? -0.3 : 0;
    const oilyBias = ctx.skinType === "oily" ? 0.3 : 0;
    const sensBias = ctx.skinType === "sensitive" ? 0.25 : 0;

    return {
      engine: "mock",
      engineVersion: this.version,
      metrics: {
        hydration: clamp01(h("hyd") + dryBias),
        oiliness: clamp01(h("oil") + oilyBias),
        redness: clamp01(h("red") + sensBias),
        evenness: clamp01(h("even")),
        smoothness: clamp01(h("smooth")),
        radiance: clamp01(h("rad")),
        poreVisibility: clamp01(h("pore")),
        sensitivityIndicators: clamp01(h("sens") + sensBias),
      },
      concerns: [
        { key: "dehydration", severity: clamp01(h("c1")), confidence: 0.7 },
        { key: "uneven_tone", severity: clamp01(h("c2")), confidence: 0.6 },
        { key: "dullness", severity: clamp01(h("c3")), confidence: 0.65 },
      ].sort((a, b) => b.severity - a.severity),
    };
  }

  async matchFoundation(_image: ImageInput, ctx: UserContext): Promise<ShadeMatch[]> {
    await new Promise((r) => setTimeout(r, 600));
    const base = hashToFloat(ctx.userId, "shade");
    return [
      {
        brand: "Toneup Edit",
        productName: "Brume Velours Foundation",
        shadeName: "Sienne brûlée",
        shadeCode: "N°04",
        hexColor: "#B58A6C",
        matchScore: 0.92 - base * 0.05,
        reason: "Warm undertone, medium depth",
      },
      {
        brand: "Toneup Edit",
        productName: "Brume Velours Foundation",
        shadeName: "Sable doux",
        shadeCode: "N°03",
        hexColor: "#C4A084",
        matchScore: 0.84,
        reason: "Slightly lighter, neutral-warm",
      },
      {
        brand: "Toneup Edit",
        productName: "Brume Velours Foundation",
        shadeName: "Terre cuite",
        shadeCode: "N°05",
        hexColor: "#8B6F4E",
        matchScore: 0.78,
        reason: "Deeper warm option",
      },
    ];
  }

  async recommendProducts(
    ctx: UserContext,
    category: ProductCategory
  ): Promise<ProductSuggestion[]> {
    await new Promise((r) => setTimeout(r, 400));
    return [
      {
        brand: "Atelier Nord",
        productName: `Hydra Veil ${category}`,
        category,
        priceTier: ctx.preferences?.budget ?? "mid",
        reason: "Matches your hydration goal and sensitivity profile",
        confidence: 0.81,
      },
    ];
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
