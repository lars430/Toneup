/**
 * i18n configuration — 6 språk fra dag én.
 *
 * Bundles for `no` og `en` er fylt ut i MVP.
 * `da`, `sv`, `es`, `fr` har strukturen klar men trenger oversettelse.
 */

import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, type Locale } from "./routing";

export type { Locale } from "./routing";
export { locales, defaultLocale };

export const localeNames: Record<(typeof locales)[number], string> = {
  no: "Norsk",
  da: "Dansk",
  sv: "Svenska",
  es: "Español",
  fr: "Français",
  en: "English",
};

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  if (!locales.includes(locale as Locale)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
