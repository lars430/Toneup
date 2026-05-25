/**
 * Domain types — speiler database-skjema.
 * Holdes manuelt synkronisert med db/schema.sql for nå;
 * kan genereres automatisk med `supabase gen types typescript` senere.
 */

export type SkinType = "dry" | "oily" | "combination" | "normal" | "sensitive" | "unknown";

export type GenderIdentity =
  | "female" | "male" | "non_binary" | "prefer_not_to_say" | "other";

export type ProductCategory =
  | "cleanser" | "toner" | "serum" | "moisturizer" | "spf"
  | "mask" | "exfoliant" | "eye_cream"
  | "foundation" | "concealer" | "blush" | "contour" | "bronzer" | "highlighter"
  | "lipstick" | "lip_gloss" | "mascara" | "eyeliner" | "eyeshadow"
  | "brow" | "setting_powder" | "other";

export type PriceTier = "budget" | "mid" | "premium" | "luxury";

export type ProductStatus = "using" | "tried" | "wishlist" | "archived";

export type LifePhase =
  | "none" | "menstrual_cycle" | "pregnancy" | "breastfeeding" | "menopause" | "other";

export type Season = "spring" | "summer" | "autumn" | "winter";

export type LocaleCode = "no" | "da" | "sv" | "es" | "fr" | "en";

export interface UserProfile {
  userId: string;
  displayName?: string;
  ageRange?: string;
  gender: GenderIdentity;
  skinType: SkinType;
  skinGoals: string[];
  helpWith: string[];
  preferences: {
    fragranceFree?: boolean;
    vegan?: boolean;
    sensitive?: boolean;
    budget?: PriceTier;
    [k: string]: unknown;
  };
  lifePhase: LifePhase;
  lifePhaseDetails?: Record<string, unknown>;
  locale: LocaleCode;
  onboardingCompletedAt?: Date;
}

export interface UserProduct {
  id: string;
  userId: string;
  productId?: string;
  customBrand?: string;
  customName?: string;
  category: ProductCategory;
  shadeName?: string;
  shadeCode?: string;
  status: ProductStatus;
  rating?: number;
  worksWell?: boolean;
  notes?: string;
  usedInSeasons?: Season[];
  startedAt?: Date;
  endedAt?: Date;
}

export interface SkinLog {
  id: string;
  userId: string;
  loggedAt: Date;
  dryness?: number;
  oiliness?: number;
  redness?: number;
  sensitivity?: number;
  breakouts?: number;
  glow?: number;
  foundationSatWell?: boolean;
  reactionToProductId?: string;
  reactionNotes?: string;
  freeText?: string;
}

export interface SeasonalProfile {
  season: Season;
  year: number;
  insights: {
    bestProducts: string[];
    dominantConcerns: string[];
    sampleSize: number;
    notes?: string;
  };
}
