/**
 * Toneup Analysis Engine — abstraksjonslag
 *
 * All "beauty AI" går gjennom denne interface.
 * Revieve, OpenAI eller mock kan plugges inn uten at UI vet om det.
 *
 * Bytt motor med env: ANALYSIS_PROVIDER=mock | revieve | openai
 */

import type { SkinType, ProductCategory, PriceTier } from "@/types/domain";

// ---- Inputs ----

export interface UserContext {
  userId: string;
  skinType?: SkinType;
  skinGoals?: string[];
  preferences?: {
    fragranceFree?: boolean;
    vegan?: boolean;
    budget?: PriceTier;
    sensitive?: boolean;
  };
  locale: string;
}

export interface ImageInput {
  /** Buffer or signed URL pointing to user's image in Supabase storage */
  source: Buffer | string;
  mimeType?: string;
}

// ---- Outputs ----

export type ConfidenceLevel = "high" | "medium" | "medium-low" | "low";
export type Undertone = "warm" | "cool" | "neutral" | "olive" | "likely-warm-neutral" | "uncertain";
export type RednessPattern = "none" | "central" | "cheeks" | "local" | "diffuse";

export interface SkinAnalysisResult {
  engine: "revieve" | "mock" | "openai";
  engineVersion: string;

  /**
   * 0-100 priority scores. These are RELATIVE signals for product matching,
   * NOT clinical measurements. Use them to rank concerns, not to claim "X%
   * dry skin".
   */
  scores?: {
    redness: number;
    glow: number;
    evenness: number;
    dryness: number;       // image-only — usually low confidence
  };

  /** Per-dimension confidence — drives how strongly we lean on each score */
  confidence?: {
    overall: ConfidenceLevel;
    redness: ConfidenceLevel;
    undertone: ConfidenceLevel;
    dryness: ConfidenceLevel;
    evenness: ConfidenceLevel;
  };

  /** Lighting context that affected the analysis */
  lightingQuality?: {
    overall: "good" | "warm" | "dim" | "uneven" | "unknown";
    warmthBias: number;          // 0..1, higher = more yellow indoor light
    brightness: number;          // 0..1
    notes: string[];
  };

  /** Top concern keys, ranked */
  primaryConcern?: string;
  secondaryConcerns?: string[];
  lowPriorityConcerns?: string[];

  /** Short explanation of why each score landed where it did */
  scoreRationale?: Record<string, string>;

  /** What the picture actually shows */
  observations?: string[];
  /** What that might mean — explicitly tentative */
  interpretations?: string[];
  /** What the user should prioritize */
  recommendations?: string[];

  /**
   * Legacy normalized 0..1 metrics. Kept for backward compatibility with
   * existing code paths (home/result pages, rules engine). Mirrors `scores`
   * scaled to 0..1 where applicable.
   */
  metrics: {
    hydration: number;
    oiliness: number;
    redness: number;
    evenness: number;
    smoothness: number;
    radiance: number;
    poreVisibility: number;
    sensitivityIndicators: number;
  };

  /** Detected concerns ranked by salience */
  concerns: Array<{
    key: string;
    severity: number;
    confidence: number;
  }>;

  /** Optional raw payload for debugging / future re-processing */
  raw?: unknown;
}

export interface ShadeMatch {
  productId?: string;
  brand: string;
  productName: string;
  shadeName: string;
  shadeCode?: string;
  hexColor?: string;
  matchScore: number;        // 0..1
  reason?: string;
}

export interface ProductSuggestion {
  productId?: string;
  brand: string;
  productName: string;
  category: ProductCategory;
  priceTier?: PriceTier;
  reason: string;            // human-readable, localized later
  confidence: number;
}

// ---- The contract ----

export interface AnalysisProvider {
  readonly name: "revieve" | "mock" | "openai";
  readonly version: string;

  analyzeSkin(
    image: ImageInput,
    ctx: UserContext
  ): Promise<SkinAnalysisResult>;

  matchFoundation(
    image: ImageInput,
    ctx: UserContext
  ): Promise<ShadeMatch[]>;

  recommendProducts(
    ctx: UserContext,
    category: ProductCategory
  ): Promise<ProductSuggestion[]>;
}
