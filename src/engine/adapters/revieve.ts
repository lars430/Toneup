/**
 * RevieveAdapter — wrapper rundt Revieve SDK/API.
 *
 * STATUS: Skjelett. Fylles inn når API-tilgang er på plass.
 * Kontrakten er identisk med MockAdapter, så bytte er null kode-endringer
 * utenfor `engine/index.ts`.
 *
 * Refs: https://www.revieve.com  (sjekk faktisk SDK-dokumentasjon ved implementering)
 */

import type {
  AnalysisProvider,
  ImageInput,
  UserContext,
  SkinAnalysisResult,
  ShadeMatch,
  ProductSuggestion,
} from "../types";
import type { ProductCategory } from "@/types/domain";

interface RevieveConfig {
  apiKey: string;
  partnerId: string;
  baseUrl?: string;
}

export class RevieveAdapter implements AnalysisProvider {
  readonly name = "revieve" as const;
  readonly version = "1.0.0";

  constructor(private readonly cfg: RevieveConfig) {
    if (!cfg.apiKey || !cfg.partnerId) {
      throw new Error("RevieveAdapter: missing apiKey or partnerId");
    }
  }

  async analyzeSkin(image: ImageInput, ctx: UserContext): Promise<SkinAnalysisResult> {
    // 1. Upload/reference image to Revieve
    // 2. Call skin analysis endpoint
    // 3. Map raw Revieve payload → our normalized SkinAnalysisResult.metrics
    //
    // const raw = await this.callRevieveAPI("/skin/analyze", { image, ... });
    // return this.normalize(raw);
    throw new Error("RevieveAdapter.analyzeSkin not yet implemented");
  }

  async matchFoundation(image: ImageInput, ctx: UserContext): Promise<ShadeMatch[]> {
    throw new Error("RevieveAdapter.matchFoundation not yet implemented");
  }

  async recommendProducts(
    ctx: UserContext,
    category: ProductCategory
  ): Promise<ProductSuggestion[]> {
    throw new Error("RevieveAdapter.recommendProducts not yet implemented");
  }

  // ---- Private helpers (to fill in) ----

  private normalize(raw: unknown): SkinAnalysisResult {
    // Map Revieve's specific schema to our motor-agnostic shape.
    // Keep raw payload in result.raw for debugging.
    throw new Error("not implemented");
  }
}
