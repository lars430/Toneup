export const locales = ["no", "da", "sv", "es", "fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "no";
