/**
 * Central brand configuration.
 *
 * All brand-specific values live here. To rebrand the app, update this file
 * only — nothing else in the codebase should hard-code these values
 * programmatically (editorial copy in pages is fine to keep as-is, since
 * that belongs in translation files when updated).
 */
export const brand = {
  name: "Toneup",
  tagline: {
    no: "En personlig beauty-assistent som lærer deg å kjenne over tid",
    en: "A personal beauty assistant that gets to know you over time",
    da: "En personlig beauty-assistent der lærer dig at kende over tid",
    sv: "En personlig beauty-assistent som lär känna dig över tid",
    es: "Un asistente de belleza personal que te conoce con el tiempo",
    fr: "Un assistant beauté personnel qui vous connaît avec le temps",
  },
  shortTagline: {
    no: "Et stille ritual av eleganse",
    en: "A quiet ritual of elegance",
    da: "Et stille ritual af elegance",
    sv: "Ett stilla ritual av elegans",
    es: "Un ritual tranquilo de elegancia",
    fr: "Un rituel silencieux d'élégance",
  },
  /** Used in metadata, favicons, and app manifests */
  metaName: "Toneup",
  metaDescription: {
    no: "Personlig hudpleie- og sminkerådgivning som lærer huden din å kjenne over tid.",
    en: "Personal skincare and beauty advice that learns your skin over time.",
  },
  /** Change to swap the primary accent hue across the design system */
  accentColor: "#8B6F4E",
  version: "1.0",
  year: "MMXXV",
} as const;

export type Locale = "no" | "en" | "da" | "sv" | "es" | "fr";
