/**
 * Toneup — Makeup product enrichment
 *
 * Derives human-readable guidance for makeup products (foundation, concealer,
 * blush, bronzer, highlighter, etc.) from stored attributes.
 * Complements skincare-info.ts which handles skincare categories.
 */

export interface MakeupInfo {
  /** Who this product is typically good for */
  suitsFor: string[];
  /** Who should be cautious or avoid */
  avoidIf: string[];
  /** Key highlight (finish, coverage, undertone range) */
  keyAttributes: string[];
  /** Short application or usage note */
  howToUse: string | null;
}

export interface MakeupProduct {
  name?: string | null;
  category?: string | null;
  attributes?: any;
}

export function deriveMakeupInfo(p: MakeupProduct): MakeupInfo | null {
  const category = (p.category ?? "").toLowerCase();
  const attr = p.attributes ?? {};
  const name = (p.name ?? "").toLowerCase();

  switch (category) {
    case "foundation": return deriveFoundationInfo(attr, name);
    case "concealer":  return deriveConcealerInfo(attr, name);
    case "blush":      return deriveBlushInfo(attr, name);
    case "bronzer":    return deriveBronzerInfo(attr, name);
    case "highlighter": return deriveHighlighterInfo(attr, name);
    case "primer":     return derivePrimerInfo(attr, name);
    case "setting_powder": return deriveSettingPowderInfo(attr, name);
    default:           return null;
  }
}

// ── Foundation ─────────────────────────────────────────────────────────────

function deriveFoundationInfo(attr: any, name: string): MakeupInfo {
  const finish   = (attr.finish   ?? "").toLowerCase();
  const coverage = (attr.coverage ?? "").toLowerCase();
  const skinTypes: string[] = attr.skin_type
    ? Array.isArray(attr.skin_type) ? attr.skin_type : [attr.skin_type]
    : [];

  const suitsFor: string[] = [];
  const avoidIf: string[] = [];
  const keyAttributes: string[] = [];

  // Finish
  if (finish === "matte" || finish === "soft_matte") {
    suitsFor.push("Fet og kombinert hud");
    suitsFor.push("Daglig bruk med lang holdbarhet");
    avoidIf.push("Tørr hud — kan fremheve flassete partier");
    keyAttributes.push("Matt finish");
  } else if (finish === "dewy" || finish === "luminous" || finish === "radiant") {
    suitsFor.push("Tørr og normal hud");
    suitsFor.push("De som vil ha glød og livfull hud");
    avoidIf.push("Fet hud — kan øke glans i T-sonen");
    keyAttributes.push("Lysende / dewy finish");
  } else if (finish === "natural" || finish === "skin" || finish === "satin") {
    suitsFor.push("De fleste hudtyper");
    suitsFor.push("Naturlig look");
    keyAttributes.push("Naturlig finish");
  }

  // Coverage
  if (coverage === "light" || coverage === "sheer") {
    suitsFor.push("Jevn hud som trenger lite dekning");
    suitsFor.push("Lettvektsbruk og varme måneder");
    avoidIf.push("Aktive urenheter eller rødhet som trenger dekning");
    keyAttributes.push("Lett dekning");
  } else if (coverage === "medium") {
    suitsFor.push("De fleste — balanserer dekning og naturlighet");
    keyAttributes.push("Medium dekning");
  } else if (coverage === "full") {
    suitsFor.push("Rødhet, uren hud eller ujevn hudtone");
    avoidIf.push("Sensitiv hud — kan føles tungt ved daglig bruk");
    keyAttributes.push("Full dekning");
  }

  // Skin type from attributes
  if (skinTypes.includes("sensitive") || attr.fragrance_free) {
    suitsFor.push("Sensitiv hud");
  }
  if (skinTypes.includes("dry")) suitsFor.push("Tørr hud");
  if (skinTypes.includes("oily")) suitsFor.push("Fet hud");
  if (skinTypes.includes("acne-prone")) {
    suitsFor.push("Akne-utsatt hud (non-comedogenic)");
    keyAttributes.push("Non-comedogenic");
  }

  // Active ingredients
  if (/niacinamid|niacinamide/.test(name)) {
    suitsFor.push("Ujevn hudtone og porer");
    keyAttributes.push("Niacinamid");
  }
  if (/hyaluron|hyaluronic/.test(name)) {
    suitsFor.push("Tørr hud");
    keyAttributes.push("Hyaluronsyre");
  }
  if (/spf/.test(name) || attr.spf) {
    keyAttributes.push(`SPF ${attr.spf ?? ""}`);
    suitsFor.push("Daglig bruk med solbeskyttelse");
  }

  const howToUse = buildFoundationHowToUse(coverage, finish);

  return {
    suitsFor: dedupe(suitsFor),
    avoidIf: dedupe(avoidIf),
    keyAttributes: dedupe(keyAttributes),
    howToUse,
  };
}

function buildFoundationHowToUse(coverage: string, finish: string): string {
  if (coverage === "light" || coverage === "sheer") {
    return "Påfør med fingrene, svamp eller lett pensel for et naturlig resultat.";
  }
  if (coverage === "full") {
    return "Bygg opp dekning lag for lag med foundation-pensel eller svamp. Blend godt langs kjevelinjen.";
  }
  if (finish === "dewy" || finish === "luminous") {
    return "Påfør med fuktig svamp og blend ut mot hårfestet for naturlig glød.";
  }
  return "Påfør fra midten av ansiktet og blend ut mot hårfestet.";
}

// ── Concealer ──────────────────────────────────────────────────────────────

function deriveConcealerInfo(attr: any, name: string): MakeupInfo {
  const coverage = (attr.coverage ?? "medium").toLowerCase();
  const finish   = (attr.finish   ?? "").toLowerCase();

  const suitsFor: string[] = [
    "Mørke ringer og fine linjer under øynene",
    "Lokalt å skjule urenheter og rødhet",
  ];
  const avoidIf: string[] = [];
  const keyAttributes: string[] = [];

  if (coverage === "full") {
    keyAttributes.push("Full dekning");
    suitsFor.push("Pigmentering og arr");
  } else if (coverage === "light" || coverage === "sheer") {
    keyAttributes.push("Lett dekning");
    avoidIf.push("Dype mørke ringer — trenger mer dekning");
  } else {
    keyAttributes.push("Medium dekning");
  }

  if (finish === "radiant" || finish === "luminous") {
    suitsFor.push("Tørre partier og krefteringene under øyet");
    keyAttributes.push("Lysende finish — åpner opp øyet");
  } else if (finish === "matte") {
    suitsFor.push("Urenheter og T-sone");
    avoidIf.push("Under øyet — matte formler kan se tørt ut");
    keyAttributes.push("Matt finish");
  }

  return {
    suitsFor: dedupe(suitsFor),
    avoidIf: dedupe(avoidIf),
    keyAttributes: dedupe(keyAttributes),
    howToUse: "Påfør med fingertuppene eller en liten pensels i triangelform under øyet. Blend forsiktig.",
  };
}

// ── Blush ──────────────────────────────────────────────────────────────────

function deriveBlushInfo(attr: any, name: string): MakeupInfo {
  const finish = (attr.finish ?? "").toLowerCase();
  const isLiquid = /liquid|fluid|dew/.test(name);
  const isPowder = /powder|press/.test(name);
  const isCream  = /cream|balm/.test(name);

  const suitsFor: string[] = [];
  const avoidIf: string[] = [];
  const keyAttributes: string[] = [];

  if (isLiquid) {
    suitsFor.push("Naturlig, hudlignende finish");
    suitsFor.push("Dewy og glødende utseende");
    keyAttributes.push("Flytende formel — smeltende i huden");
  } else if (isCream) {
    suitsFor.push("Tørr hud — blander seg naturlig");
    keyAttributes.push("Krem-formel");
  } else if (isPowder || (!isLiquid && !isCream)) {
    suitsFor.push("Fet og kombinert hud");
    suitsFor.push("Lang holdbarhet");
    keyAttributes.push("Pudder-formel");
    avoidIf.push("Svært tørr hud — kan fremheve flassete partier");
  }

  if (finish === "luminous" || finish === "radiant") {
    keyAttributes.push("Lysende finish");
    suitsFor.push("Glød og lift til kinnbenet");
  } else if (finish === "matte") {
    keyAttributes.push("Matt finish — naturlig hverdagslook");
  }

  return {
    suitsFor: dedupe(suitsFor),
    avoidIf: dedupe(avoidIf),
    keyAttributes: dedupe(keyAttributes),
    howToUse: "Påfør på kinnbenene i et smil-bevegelse. Blend oppover mot templene.",
  };
}

// ── Bronzer ────────────────────────────────────────────────────────────────

function deriveBronzerInfo(attr: any, name: string): MakeupInfo {
  const finish = (attr.finish ?? "natural").toLowerCase();

  const suitsFor: string[] = [
    "Definisjon og varme i ansiktet",
    "Contouring langs kjevebein og tinning",
  ];
  const avoidIf: string[] = [];
  const keyAttributes: string[] = [];

  if (finish === "matte") {
    keyAttributes.push("Matt finish — best for contouring");
    suitsFor.push("Definert, skulpturert look");
  } else if (finish === "radiant" || finish === "luminous") {
    keyAttributes.push("Shimmer / lysende finish");
    suitsFor.push("Sol-glød og varmt utseende");
    avoidIf.push("Oily hud — shimmer kan fremheve glans");
  } else {
    keyAttributes.push("Naturlig finish");
  }

  return {
    suitsFor: dedupe(suitsFor),
    avoidIf: dedupe(avoidIf),
    keyAttributes: dedupe(keyAttributes),
    howToUse: "Påfør med en bred contour-pensel i en 3-form: tinning, kinnbein og under kjevebenet. Blend godt.",
  };
}

// ── Highlighter ────────────────────────────────────────────────────────────

function deriveHighlighterInfo(attr: any, name: string): MakeupInfo {
  const isLiquid = /liquid|wand|beam/.test(name);
  const isStick  = /stick|rod/.test(name);

  const suitsFor: string[] = [
    "Glød og lift på kinnben, neserygg og Cupidos bue",
  ];
  const avoidIf: string[] = [
    "Fet hud i T-sonen — unngå å påføre i disse områdene",
  ];
  const keyAttributes: string[] = [];

  if (isLiquid) {
    keyAttributes.push("Flytende formel — blandes med foundation");
    suitsFor.push("En naturlig glød blandet inn i basen");
  } else if (isStick) {
    keyAttributes.push("Stift-format — presist påført");
  } else {
    keyAttributes.push("Pudder-formel");
  }

  return {
    suitsFor: dedupe(suitsFor),
    avoidIf: dedupe(avoidIf),
    keyAttributes: dedupe(keyAttributes),
    howToUse: "Påfør lett på kinnbenets høyeste punkt, neserygg og i indre øyekrok for maksimal glød.",
  };
}

// ── Primer ─────────────────────────────────────────────────────────────────

function derivePrimerInfo(attr: any, name: string): MakeupInfo {
  const isPoreFilling = /pore|matte|blur/.test(name);
  const isHydrating   = /hydrat|glow|dew|luminous/.test(name);
  const isColor       = /green|color|colour|correcting/.test(name);

  const suitsFor: string[] = ["Bedre holdbarhet for makeup"];
  const avoidIf: string[] = [];
  const keyAttributes: string[] = [];

  if (isPoreFilling) {
    suitsFor.push("Redusere synligheten av porer");
    suitsFor.push("Fet og kombinert hud");
    keyAttributes.push("Poreutjevnende");
  }
  if (isHydrating) {
    suitsFor.push("Tørr hud — forbereder et glatt underlag");
    keyAttributes.push("Fuktig primer");
    avoidIf.push("Svært fet hud — kan øke glans");
  }
  if (isColor) {
    suitsFor.push("Nøytralisere rødhet eller gulfarge");
    keyAttributes.push("Fargekorrigerende");
  }

  return {
    suitsFor: dedupe(suitsFor),
    avoidIf: dedupe(avoidIf),
    keyAttributes: dedupe(keyAttributes),
    howToUse: "Påfør etter hudpleie og solfaktor, men før foundation. Vent 1–2 min til det setter seg.",
  };
}

// ── Setting Powder ─────────────────────────────────────────────────────────

function deriveSettingPowderInfo(attr: any, name: string): MakeupInfo {
  const isTranslucent = /translucent|loose|setting/.test(name);
  const isBaked       = /baked|pressed/.test(name);

  const suitsFor: string[] = ["Forlenge holdbarhet av foundation og concealer"];
  const avoidIf: string[] = [];
  const keyAttributes: string[] = [];

  if (isTranslucent) {
    suitsFor.push("Alle hudtyper — transparent finish");
    keyAttributes.push("Transparent (ingen ekstra dekning)");
  } else if (isBaked) {
    suitsFor.push("Sette foundation og legge til glød");
    keyAttributes.push("Baked-formel");
  }

  return {
    suitsFor: dedupe(suitsFor),
    avoidIf: dedupe([...avoidIf, "Tørr hud — kan se pulveraktig ut ved overbruk"]),
    keyAttributes: dedupe(keyAttributes),
    howToUse: "Påfør med en stor, fluffy pensel i lette, swirling bevegelser. Fokuser på T-sonen.",
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}
