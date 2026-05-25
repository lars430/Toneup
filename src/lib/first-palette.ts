/**
 * Toneup First Palette Report
 *
 * Generates an editorial profile report immediately after onboarding,
 * BEFORE any skin analysis or product logging.
 *
 * Goal: the user's first 90 seconds in Toneup must feel like a discovery —
 * not a survey. We use only what they told us during onboarding
 * (skin type, goals, preferences, life phase, age) plus the current season,
 * and we present it as if it were a curated editorial spread.
 *
 * This is the "Spotify Wrapped energy" we need on day 1.
 */

import type { UserProfile, Season } from "@/types/domain";

export interface FirstPaletteReport {
  // Hero
  paletteName: string;             // "Vår nordique" — given to the user
  paletteNumber: string;           // "N° 01"
  paletteIntroLine: string;        // Editorial italic tagline

  // Visual seed palette (3-5 hex colors that match their profile)
  paletteColors: Array<{
    hex: string;
    label: string;                 // "Bone", "Cinnamon", "Plum whisper"
    role: string;                  // "base", "accent", "lip"
  }>;

  // The "this is you" section — flattering, specific, never clinical
  characterTraits: Array<{
    eyebrow: string;               // "Tone", "Tempo", "Tendens"
    title: string;
    body: string;
  }>;

  // Concrete starting points — 3 products to try, drawn from catalog
  startingPicks: Array<{
    productId?: string;
    category: string;
    brand: string;
    name: string;
    shadeName?: string;
    reason: string;
  }>;

  // The ritual recommendation — gives user something to do today
  todaysRitual: {
    title: string;
    steps: string[];
  };

  // Season-aware note
  seasonalNote: string;
}

interface ReportContext {
  profile: UserProfile;
  currentSeason: Season;
  catalog: any[];                   // products table rows
}

// ============================================================
// PALETTE FAMILIES
// ============================================================
// Each profile gets matched to one of these visual palettes.
// Names sound editorial, not algorithmic.

const PALETTES = {
  nordic_dawn: {
    name: "Aube nordique",
    intro: "Stille morgenlys, kalde nyanser, ren disiplin.",
    colors: [
      { hex: "#F6F2EC", label: "Bone", role: "base" },
      { hex: "#E5C8B8", label: "Rose pâle", role: "accent" },
      { hex: "#B05670", label: "Berry whisper", role: "lip" },
    ],
  },
  warm_terracotta: {
    name: "Terre brûlée",
    intro: "Varm tone, gylden undertone, italiensk kveldslys.",
    colors: [
      { hex: "#EFE8DE", label: "Cream", role: "base" },
      { hex: "#C97359", label: "Terracotta", role: "accent" },
      { hex: "#8B4438", label: "Terre rouge", role: "lip" },
    ],
  },
  neutral_sand: {
    name: "Sable doré",
    intro: "Balansert, raffinert, varm sand mot kjølig stein.",
    colors: [
      { hex: "#F6F2EC", label: "Bone", role: "base" },
      { hex: "#B58463", label: "Bronze glow", role: "accent" },
      { hex: "#9D5C42", label: "Sienne brûlée", role: "lip" },
    ],
  },
  deep_velvet: {
    name: "Velours profond",
    intro: "Mettet, dyp, en stille intensitet.",
    colors: [
      { hex: "#EFE8DE", label: "Cream", role: "base" },
      { hex: "#8A5469", label: "Plum whisper", role: "accent" },
      { hex: "#5C2A2A", label: "Bordeaux", role: "lip" },
    ],
  },
  fresh_porcelain: {
    name: "Porcelaine fraîche",
    intro: "Lys og levende, kjølig undertone, vårluft.",
    colors: [
      { hex: "#F6F2EC", label: "Bone", role: "base" },
      { hex: "#F4C7C3", label: "Petal pink", role: "accent" },
      { hex: "#B57589", label: "Rose antique", role: "lip" },
    ],
  },
};

// ============================================================
// PUBLIC API
// ============================================================

export function generateFirstPaletteReport(ctx: ReportContext): FirstPaletteReport {
  const palette = pickPalette(ctx.profile);
  const traits = generateTraits(ctx.profile, ctx.currentSeason);
  const picks = pickStartingProducts(ctx);
  const ritual = generateRitual(ctx.profile, ctx.currentSeason);
  const seasonalNote = generateSeasonalNote(ctx.currentSeason, ctx.profile);

  return {
    paletteName: palette.def.name,
    paletteNumber: "N° 01",
    paletteIntroLine: palette.def.intro,
    paletteColors: palette.def.colors,
    characterTraits: traits,
    startingPicks: picks,
    todaysRitual: ritual,
    seasonalNote,
  };
}

// ============================================================
// PALETTE SELECTION
// ============================================================

function pickPalette(p: UserProfile) {
  // Use stated skin type + goals as primary signal.
  // (After first real analysis, we re-derive based on measured undertone.)
  const goals = new Set(p.skinGoals);
  const isSensitive = p.skinType === "sensitive" || p.preferences?.sensitive;
  const wantsGlow = goals.has("glow");
  const wantsEven = goals.has("even_tone");
  const wantsAntiAge = goals.has("anti_aging");

  // Norwegian/Nordic users (locale=no/da/sv) get a slight bias toward
  // fair palettes since that's statistically more common.
  const nordicBias = ["no", "da", "sv"].includes(p.locale);

  if (isSensitive && nordicBias) {
    return { key: "fresh_porcelain", def: PALETTES.fresh_porcelain };
  }
  if (wantsGlow && wantsEven) {
    return { key: "warm_terracotta", def: PALETTES.warm_terracotta };
  }
  if (wantsAntiAge) {
    return { key: "deep_velvet", def: PALETTES.deep_velvet };
  }
  if (nordicBias) {
    return { key: "nordic_dawn", def: PALETTES.nordic_dawn };
  }
  return { key: "neutral_sand", def: PALETTES.neutral_sand };
}

// ============================================================
// CHARACTER TRAITS
// ============================================================

function generateTraits(p: UserProfile, season: Season) {
  const traits: FirstPaletteReport["characterTraits"] = [];

  // Trait 1 — based on stated skin type
  const skinNarratives: Record<string, { title: string; body: string }> = {
    dry: {
      title: "Tørst etter fukt",
      body: "Din hud ber om rik pleie og lagvis hydrering. Olje før krem — alltid.",
    },
    oily: {
      title: "Levende og lys",
      body: "Din naturlige glød er en gave. Vi finner tekstur som beholder den uten å forsterke.",
    },
    combination: {
      title: "To rytmer i én",
      body: "Du har soner som krever ulik omtanke. Vi bygger ritualer som ærer begge.",
    },
    sensitive: {
      title: "Hud som lytter",
      body: "Reaktiv betyr ikke svak. Vi velger formler som beroliger uten å svekke.",
    },
    normal: {
      title: "Hud i balanse",
      body: "Et godt utgangspunkt. Vår oppgave er å bevare det, ikke forstyrre det.",
    },
    unknown: {
      title: "Hud i utforskning",
      body: "Vi finner mønstrene sammen — uten å haste til konklusjoner.",
    },
  };
  traits.push({
    eyebrow: "Tendens",
    ...skinNarratives[p.skinType] ?? skinNarratives.unknown,
  });

  // Trait 2 — based on primary goal
  const goal = p.skinGoals[0];
  const goalNarratives: Record<string, { title: string; body: string }> = {
    glow: {
      title: "Søker etter lys",
      body: "Glød er ikke skinn — det er hud i full helse. Vi bygger den fra innsiden av ritualet.",
    },
    less_dryness: {
      title: "Lengter etter fylde",
      body: "Mer fukt, færre lag som krangler. Vi forenkler veien til komfort.",
    },
    less_acne: {
      title: "Søker etter ro",
      body: "Klar hud handler om balanse, ikke kamp. Vi velger formler som beroliger uten å overstyre.",
    },
    even_tone: {
      title: "Streber mot ensartet",
      body: "Vi jobber mot en jevn, sammenhengende tone — ikke maskering.",
    },
    anti_aging: {
      title: "Tenker langsiktig",
      body: "Forebygging er det vakreste anti-aging-rituale. Vi bygger en rytme som tåler årene.",
    },
    less_sensitivity: {
      title: "Beroliger seg",
      body: "Færre ingredienser, mer presisjon. Mindre kan være mer.",
    },
  };
  if (goal && goalNarratives[goal]) {
    traits.push({ eyebrow: "Mål", ...goalNarratives[goal] });
  }

  // Trait 3 — based on season + preferences
  if (p.preferences?.budget === "luxury" || p.preferences?.budget === "premium") {
    traits.push({
      eyebrow: "Smak",
      title: "Trekker mot fine ting",
      body: "Du verdsetter tekstur, opprinnelse og varighet. Vi kuraterer deretter.",
    });
  } else if (p.preferences?.vegan || p.preferences?.fragranceFree) {
    traits.push({
      eyebrow: "Filosofi",
      title: "Bevisste valg",
      body: "Du leter etter formler som matcher dine prinsipper, ikke kompromisser dem.",
    });
  } else {
    const seasonTraits = {
      spring: { title: "I sesongens lys", body: "Våren ber om lettere lag, mer fukt, mindre dekke." },
      summer: { title: "I sesongens lys", body: "Sommeren ber om beskyttelse og friskhet — SPF blir et ritual." },
      autumn: { title: "I sesongens lys", body: "Høsten ber om reparasjon — barriéren har jobbet hardt." },
      winter: { title: "I sesongens lys", body: "Vinteren ber om rikere lag og olje — kald luft stjeler fukt." },
    };
    traits.push({ eyebrow: "Tempo", ...seasonTraits[season] });
  }

  return traits;
}

// ============================================================
// PRODUCT PICKS
// ============================================================

function pickStartingProducts(ctx: ReportContext): FirstPaletteReport["startingPicks"] {
  const { profile, catalog } = ctx;
  const budget = profile.preferences?.budget ?? "mid";
  const tiers = budgetToTiers(budget);

  // Pick 3 anchor products: cleanser, moisturizer, plus one based on goal
  const picks: FirstPaletteReport["startingPicks"] = [];

  const cleanser = pickFromCatalog(catalog, {
    category: "cleanser",
    tiers,
    requireFragranceFree: !!profile.preferences?.fragranceFree,
  });
  if (cleanser) picks.push({
    productId: cleanser.id,
    category: "cleanser",
    brand: cleanser.brand,
    name: cleanser.name,
    reason: "En rolig start på ditt morgenritual",
  });

  const moisturizer = pickFromCatalog(catalog, {
    category: "moisturizer",
    tiers,
    requireFragranceFree: !!profile.preferences?.fragranceFree,
  });
  if (moisturizer) picks.push({
    productId: moisturizer.id,
    category: "moisturizer",
    brand: moisturizer.brand,
    name: moisturizer.name,
    reason: "Bygger fukt-laget appen vil hjelpe deg å vurdere",
  });

  // Third pick based on goal
  const goal = profile.skinGoals[0];
  if (goal === "glow" || goal === "anti_aging") {
    const serum = pickFromCatalog(catalog, {
      category: "serum",
      tiers,
      requireFragranceFree: !!profile.preferences?.fragranceFree,
      addresses: goal,
    });
    if (serum) picks.push({
      productId: serum.id,
      category: "serum",
      brand: serum.brand,
      name: serum.name,
      reason: `Adresserer ditt hovedmål: ${goalLabel(goal)}`,
    });
  } else {
    const spf = pickFromCatalog(catalog, {
      category: "spf",
      tiers,
      requireFragranceFree: !!profile.preferences?.fragranceFree,
    });
    if (spf) picks.push({
      productId: spf.id,
      category: "spf",
      brand: spf.brand,
      name: spf.name,
      reason: "Det viktigste anti-aging-ritualet — uavhengig av sesong",
    });
  }

  return picks;
}

function budgetToTiers(budget: string): string[] {
  switch (budget) {
    case "budget": return ["budget"];
    case "mid": return ["budget", "mid"];
    case "premium": return ["mid", "premium"];
    case "luxury": return ["premium", "luxury"];
    default: return ["mid"];
  }
}

function pickFromCatalog(catalog: any[], filter: {
  category: string;
  tiers: string[];
  requireFragranceFree?: boolean;
  addresses?: string;
}) {
  const candidates = catalog.filter((p) => {
    if (p.category !== filter.category) return false;
    if (!filter.tiers.includes(p.price_tier)) return false;
    if (filter.requireFragranceFree && !p.attributes?.fragrance_free) return false;
    if (filter.addresses && !(p.attributes?.addresses ?? []).includes(filter.addresses)) return false;
    return true;
  });
  // Prefer verified products; fall back to unverified
  const verified = candidates.filter((p) => p.verified);
  const pool = verified.length > 0 ? verified : candidates;
  return pool[0]; // deterministic — improve with scoring later
}

function goalLabel(g: string): string {
  const labels: Record<string, string> = {
    glow: "glød",
    anti_aging: "forebygge aldring",
    less_dryness: "mindre tørrhet",
    less_acne: "mindre akne",
    even_tone: "jevnere hudtone",
    less_sensitivity: "mindre sensitivitet",
  };
  return labels[g] ?? g;
}

// ============================================================
// RITUAL
// ============================================================

function generateRitual(p: UserProfile, season: Season): FirstPaletteReport["todaysRitual"] {
  const isWinter = season === "winter";
  const isSummer = season === "summer";

  if (p.skinType === "dry" || p.skinGoals.includes("less_dryness")) {
    return {
      title: "Et fyldig kveldsritual",
      steps: [
        "Rens med olje eller mild krem — aldri skum",
        "Påfør et serum med hyaluronsyre på fuktig hud",
        "Forsegle med en rik krem, klapp inn med fingrene",
        "Avslutt med et lett ansiktsolje på de tørreste partiene",
      ],
    };
  }

  if (isSummer) {
    return {
      title: "Et lett morgenritual",
      steps: [
        "Skyll ansiktet med kjølig vann",
        "Spray en lett tonic-mist for å tilføre fukt",
        "Påfør en gel-basert fuktighetskrem",
        "Forsegle med SPF 30+ — selv i skyet vær",
      ],
    };
  }

  if (isWinter) {
    return {
      title: "Et beroligende kveldsritual",
      steps: [
        "Rens med mild krem eller olje",
        "Påfør et fuktgivende serum med ceramider",
        "Lag-på-lag: tynne lag fukt før den rike kremen",
        "Avslutt med en barriere-balm rundt nese og munn",
      ],
    };
  }

  return {
    title: "Ditt første ritual",
    steps: [
      "Rens med en mild gel eller krem",
      "Påfør et serum — vi finner det rette etter første hudlogg",
      "Forsegle med en lett, fuktgivende krem",
      "SPF 30+ om dagen — alltid, alle årstider",
    ],
  };
}

function generateSeasonalNote(season: Season, p: UserProfile): string {
  const notes = {
    spring: "Våren bringer skiftende lys og pollen. Vi logger reaksjoner sammen.",
    summer: "Sommeren stiller andre krav. SPF blir hovedrollen.",
    autumn: "Høsten er reparasjonens sesong. Barriéren trenger omsorg.",
    winter: "Vinteren er rikhetens tid. Rikere kremer, varmere ritualer.",
  };
  return notes[season];
}
