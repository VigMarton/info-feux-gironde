import de from "./de.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import nl from "./nl.json";

export type Locale = "fr" | "en" | "es" | "de" | "nl";

/** Shape of every translated content field (matches `localizedText` in content/schemas.ts). */
export type LocalizedText = Record<Locale, string>;

export const locales: readonly Locale[] = ["fr", "en", "es", "de", "nl"];
export const defaultLocale: Locale = "fr";

const dictionaries: Record<Locale, Record<string, string>> = { fr, en, es, de, nl };

/**
 * Look up a UI string for the given locale, falling back to the default
 * locale and finally to the raw key if nothing matches. Supports simple
 * `{{name}}` interpolation.
 */
export function t(locale: Locale, key: string, vars?: Record<string, string>): string {
  const dict = dictionaries[locale] ?? dictionaries[defaultLocale];
  const template = dict[key] ?? dictionaries[defaultLocale][key] ?? key;

  if (!vars) return template;

  return Object.entries(vars).reduce(
    (result, [name, value]) => result.replaceAll(`{{${name}}}`, value),
    template,
  );
}

const BCP47_TAG: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  es: "es-ES",
  de: "de-DE",
  nl: "nl-NL",
};

/** Human-readable name of a locale, in that locale's own language. */
export const localeName: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  nl: "Nederlands",
};

/** Formats an ISO datetime for display in the given locale. Never throws. */
export function formatDateTime(locale: Locale, iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat(BCP47_TAG[locale], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
