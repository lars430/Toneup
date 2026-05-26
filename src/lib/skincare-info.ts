/**
 * Toneup — Skincare product enrichment
 *
 * Pure function that derives human-readable info about a skincare product
 * from its attributes + name + category. Used on the product detail page
 * and the Routine Match flow.
 */

export type RoutineSlot = "am" | "pm" | "both";

export interface SkincareInfo {
  /** "Tørr hud · Sensitiv hud" — who this product is for */
  suitsFor: string[];
  /** "Sterk rødhet · Graviditet" — who should avoid */
  avoidIf: string[];
  /** "Niacinamid 10%" or null */
  keyIngredient: string | null;
  /** Concerns addressed: "Hydrering · Brightening" */
  addressesConcerns: string[];
  /** AM / PM / both */
  routineSlot: RoutineSlot;
  /** 1 (cleanse) to 7 (SPF) — order in routine */
  routineStep: number;
  /** Active type for warnings: "retinoid" | "aha" | "bha" | "vitamin_c" | null */
  activeType: ActiveType | null;
  /** Is pregnancy-safe? null = unknown */
  pregnancySafe: boolean | null;
  /** Short use instruction */
  howToUse: string | null;
}

type ActiveType = "retinoid" | "aha" | "bha" | "vitamin_c" | "exfoliant";

export interface SkincareProduct {
  name?: string | null;
  category?: string | null;
  attributes?: any;
}

// ────────────────────────────────────────────────────────────────────
// Derivation
// ────────────────────────────────────────────────────────────────────

export function deriveSkincareInfo(p: SkincareProduct): SkincareInfo {
  const name = (p.name ?? "").toLowerCase();
  const category = (p.category ?? "").toLowerCase();
  const attr = p.attributes ?? {};

  const activeType = detectActive(name);
  const routineSlot = deriveRoutineSlot(category, activeType, attr);
  const routineStep = deriveRoutineStep(category);
  const pregnancySafe =
    typeof attr.pregnancy_safe === "boolean"
      ? attr.pregnancy_safe
      : activeType === "retinoid"
      ? false
      : activeType === "vitamin_c"
      ? true
      : null;

  return {
    suitsFor: deriveSuitsFor(attr, name, category, activeType),
    avoidIf: deriveAvoidIf(attr, name, activeType, pregnancySafe),
    keyIngredient: deriveKeyIngredient(attr, name),
    addressesConcerns: deriveConcerns(attr, name, category),
    routineSlot,
    routineStep,
    activeType,
    pregnancySafe,
    howToUse: deriveHowToUse(category, routineSlot, activeType),
  };
}

// ────────────────────────────────────────────────────────────────────

function detectActive(name: string): ActiveType | null {
  if (/retinol|retinal|retinoid|retiniseren/.test(name)) return "retinoid";
  if (/glycolic|lactic|mandelic|aha/.test(name)) return "aha";
  if (/salicylic|bha/.test(name)) return "bha";
  if (/vitamin c|ascorbic|c\s|c-firma|c e ferulic/.test(name)) return "vitamin_c";
  if (/exfoliat|peeling|scrub|enzyme/.test(name)) return "exfoliant";
  return null;
}

function deriveRoutineSlot(
  category: string,
  active: ActiveType | null,
  attr: any
): RoutineSlot {
  if (category === "spf" || category === "sunscreen" || attr.spf) return "am";
  if (active === "retinoid" || active === "aha") return "pm";
  if (active === "vitamin_c") return "am";
  if (category === "mask" || category === "exfoliant") return "pm";
  if (category === "eye_cream") return "both";
  return "both";
}

function deriveRoutineStep(category: string): number {
  const order: Record<string, number> = {
    cleanser: 1,
    toner: 2,
    exfoliant: 2,
    mask: 2,
    serum: 3,
    eye_cream: 4,
    moisturizer: 5,
    oil: 6,
    spf: 7,
    sunscreen: 7,
  };
  return order[category] ?? 5;
}

function deriveSuitsFor(
  attr: any,
  name: string,
  category: string,
  active: ActiveType | null
): string[] {
  const out = new Set<string>();

  // Direct skin_type attribute (array or string)
  const types = normalizeArray(attr.skin_type);
  for (const t of types) {
    const label = skinTypeLabel(t);
    if (label) out.add(label);
  }

  // Heuristic — name hints
  if (/hydrat|moistur|hyaluron|aqua|fukt|hydra/.test(name)) {
    out.add("Tørr og dehydrert hud");
  }
  if (/calm|cica|niacinamid|centella|sensitiv|allantoin|panthenol/.test(name)) {
    out.add("Sensitiv hud");
  }
  if (/oil control|matt|mattifying|sebum|t-sone/.test(name)) {
    out.add("Fet og kombinert hud");
  }
  if (/anti.?age|wrinkle|firming|lift|retinol/.test(name)) {
    out.add("Moden hud");
  }
  if (/brighten|radiance|glow|even tone|vitamin c|dark spot/.test(name)) {
    out.add("Matt eller ujevn hud");
  }
  if (/acne|blemish|breakout|spot|imperfection/.test(name)) {
    out.add("Uren hud");
  }

  // Active = good for specific concerns
  if (active === "retinoid") out.add("Hud som tåler aktive ingredienser");
  if (active === "vitamin_c") out.add("Matt hud som vil ha glød");
  if (active === "bha") out.add("Fet hud med tette porer");
  if (active === "aha") out.add("Ujevn eller matt hud");

  // SPF
  if (category === "spf" || category === "sunscreen" || attr.spf) {
    out.add("Alle hudtyper, daglig");
  }

  if (out.size === 0) out.add("De fleste hudtyper");

  return Array.from(out).slice(0, 4);
}

function deriveAvoidIf(
  attr: any,
  name: string,
  active: ActiveType | null,
  pregnancySafe: boolean | null
): string[] {
  const out: string[] = [];

  if (active === "retinoid") {
    out.push("Sensitiv hud i akutt fase");
    out.push("Graviditet og amming");
  }
  if (active === "aha" || active === "bha") {
    out.push("Svekket hudbarriere");
    out.push("Forhøyet rødhet eller solbrenthet");
  }
  if (active === "exfoliant") {
    out.push("Akutt sensitiv eller reaktiv hud");
  }
  if (active === "vitamin_c") {
    if (/20%|23%|25%|15%|c-firma|ce ferulic|c e ferulic/.test(name)) {
      out.push("Svært sensitiv hud (start med lavere konsentrasjon)");
    }
  }
  if (pregnancySafe === false && !out.includes("Graviditet og amming")) {
    out.push("Graviditet og amming");
  }

  // Fragrance flag
  if (attr.fragrance_free === false) {
    // explicit not-fragrance-free — usually not stored. Skip.
  }
  if (!attr.fragrance_free && /perfum|fragrance|parfum/i.test(name)) {
    out.push("Parfymeintolerant hud");
  }

  if (out.length === 0) return [];
  return out.slice(0, 4);
}

function deriveKeyIngredient(attr: any, name: string): string | null {
  if (typeof attr.key_ingredient === "string") return capitalize(attr.key_ingredient);

  // Try detect from name
  const m =
    name.match(/(retinol|retinal|retinoid)/i) ||
    name.match(/(niacinamid[e]?)/i) ||
    name.match(/(hyaluronic|hyaluron)/i) ||
    name.match(/(salicylic acid|salicylsyre)/i) ||
    name.match(/(glycolic|aha|bha)/i) ||
    name.match(/(vitamin c|ascorbic)/i) ||
    name.match(/(ceramide)/i) ||
    name.match(/(peptide)/i) ||
    name.match(/(snail mucin|sneglemucin)/i) ||
    name.match(/(centella|cica)/i) ||
    name.match(/(squalane)/i);
  return m ? capitalize(m[1]) : null;
}

function deriveConcerns(attr: any, name: string, category: string): string[] {
  const out = new Set<string>();
  const addCols = (raw: unknown) => {
    for (const c of normalizeArray(raw)) {
      const label = concernLabel(c);
      if (label) out.add(label);
    }
  };
  addCols(attr.addresses);
  addCols(attr.concern);

  // Heuristic
  if (/hydrat|moistur|hyaluron/.test(name)) out.add("Hydrering");
  if (/brighten|radiance|glow|even tone|dark spot/.test(name)) out.add("Glød og jevn hudtone");
  if (/calm|cica|sensitiv|soothing|barrier/.test(name)) out.add("Beroligende og barriere");
  if (/anti.?age|wrinkle|firming/.test(name)) out.add("Modning og fastere hud");
  if (/acne|blemish|spot|pore/.test(name)) out.add("Urenheter og porer");
  if (category === "spf" || category === "sunscreen") out.add("UV-beskyttelse");

  return Array.from(out).slice(0, 4);
}

function deriveHowToUse(
  category: string,
  slot: RoutineSlot,
  active: ActiveType | null
): string | null {
  const slotLabel =
    slot === "am" ? "om morgenen" : slot === "pm" ? "om kvelden" : "morgen og kveld";
  const cat: Record<string, string> = {
    cleanser: `Bruk ${slotLabel} på fuktig hud. Skyll med lunkent vann.`,
    toner: `Etter rens, før serum. ${slot === "pm" ? "Kveld" : slotLabel}.`,
    serum: `Etter rens og toner, før krem. ${slotLabel}.`,
    moisturizer: `Som siste fukt-steg, ${slotLabel}.`,
    eye_cream: `Lett dabbing rundt øyet, ${slotLabel}.`,
    spf: `Siste steg om morgenen, generøst lag. Reapplikér hver 2. time ved soleksponering.`,
    sunscreen: `Siste steg om morgenen. Reapplikér hver 2. time ved soleksponering.`,
    mask: `1-2 ganger ukentlig, ${slot === "pm" ? "kveld" : "morgen eller kveld"}.`,
    exfoliant: `Maks 2-3 ganger ukentlig om kvelden. Bruk SPF dagen etter.`,
    oil: `Som siste eller nest siste steg ${slotLabel}.`,
  };
  let text = cat[category] ?? null;
  if (text && active === "retinoid") {
    text += " Start med 1-2 kvelder ukentlig, øk gradvis.";
  }
  return text;
}

// ────────────────────────────────────────────────────────────────────
// Labels
// ────────────────────────────────────────────────────────────────────

function skinTypeLabel(key: string): string | null {
  const m: Record<string, string> = {
    all: "Alle hudtyper",
    dry: "Tørr hud",
    normal: "Normal hud",
    oily: "Fet hud",
    combination: "Kombinert hud",
    sensitive: "Sensitiv hud",
    mature: "Moden hud",
    "very dry": "Veldig tørr hud",
    "acne-prone": "Aknetilbøyelig hud",
    "eczema-prone": "Eksemtilbøyelig hud",
  };
  return m[key.toLowerCase()] ?? null;
}

function concernLabel(key: string): string | null {
  const m: Record<string, string> = {
    hydration: "Hydrering",
    less_dryness: "Mindre tørrhet",
    glow: "Glød",
    brightening: "Brightening",
    even_tone: "Jevn hudtone",
    "dark spots": "Mørke flekker",
    "anti-aging": "Anti-aging",
    anti_aging: "Anti-aging",
    soothing: "Beroligende",
    barrier: "Hudbarriere",
    repair: "Reparasjon",
    pores: "Porer",
    pore_minimizing: "Porer",
    acne: "Acne",
    less_acne: "Urenheter",
    redness: "Rødhet",
    firming: "Fasthet",
    texture: "Tekstur",
    protection: "Beskyttelse",
  };
  return m[key.toLowerCase()] ?? capitalize(key);
}

function normalizeArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  if (typeof v === "string") return [v];
  return [];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function routineSlotLabel(slot: RoutineSlot): string {
  return slot === "am" ? "Morgen" : slot === "pm" ? "Kveld" : "Morgen og kveld";
}

export function routineStepLabel(step: number): string {
  const m: Record<number, string> = {
    1: "Steg 1 — Rens",
    2: "Steg 2 — Toner / Maske",
    3: "Steg 3 — Serum",
    4: "Steg 4 — Øyekrem",
    5: "Steg 5 — Fuktighet",
    6: "Steg 6 — Olje",
    7: "Steg 7 — SPF",
  };
  return m[step] ?? `Steg ${step}`;
}
