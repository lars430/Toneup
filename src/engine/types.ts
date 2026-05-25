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

export interface SkinAnalysisResult {
  engine: "revieve" | "mock" | "openai";
  engineVersion: string;
  /** Normalized 0..1 metrics — Toneup's contract, motor-agnostic */
  metrics: {
    hydration: number;       // 0 = very dry, 1 = well hydrated
    oiliness: number;
    redness: number;
    evenness: number;        // 0 = uneven tone, 1 = even
    smoothness: number;
    radiance: number;
    poreVisibility: number;
    sensitivityIndicators: number;
  };
  /** Detected concerns ranked by salience */
  concerns: Array<{
    key: string;             // 'dehydration', 'breakout', 'redness', 'dullness', ...
    severity: number;        // 0..1
    confidence: number;      // 0..1
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
