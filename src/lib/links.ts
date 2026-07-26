/**
 * Helpers for rendering outbound links to official/trusted sources.
 *
 * Every external link in this project points at an official or clearly
 * labeled third-party source rather than restating a claim ourselves —
 * see the "prefer links over claims" rule.
 */

import type { Locale } from "../i18n";

export type SourceTier = 0 | 1 | 2;

const TIER_LABEL: Record<SourceTier, Record<Locale, string>> = {
  0: {
    fr: "Source officielle (État)",
    en: "Official source (State)",
    es: "Fuente oficial (Estado)",
    de: "Offizielle Quelle (Staat)",
    nl: "Officiële bron (Staat)",
  },
  1: {
    fr: "Source officielle (collectivité)",
    en: "Official source (local authority)",
    es: "Fuente oficial (administración local)",
    de: "Offizielle Quelle (Gebietskörperschaft)",
    nl: "Officiële bron (lokale overheid)",
  },
  2: {
    fr: "Organisation d'aide agréée",
    en: "Accredited aid organisation",
    es: "Organización de ayuda acreditada",
    de: "Zugelassene Hilfsorganisation",
    nl: "Erkende hulporganisatie",
  },
};

export function tierLabel(tier: SourceTier, locale: Locale): string {
  return TIER_LABEL[tier][locale];
}

/** Attributes to spread on every outbound `<a>` to an external/official source. */
export const externalLinkAttrs = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

interface MappableShelter {
  address: string;
  commune: string;
  lat?: number;
  lon?: number;
}

/**
 * Builds a map link for a shelter. Only uses lat/lon when an official
 * source has published exact coordinates (see `shelterSchema`); otherwise
 * falls back to an address search so we never assert a coordinate we
 * haven't verified.
 */
export function mapUrl(shelter: MappableShelter): string {
  if (shelter.lat !== undefined && shelter.lon !== undefined) {
    return `https://www.openstreetmap.org/?mlat=${shelter.lat}&mlon=${shelter.lon}#map=17/${shelter.lat}/${shelter.lon}`;
  }

  const query = encodeURIComponent(`${shelter.address}, ${shelter.commune}`);
  return `https://www.openstreetmap.org/search?query=${query}`;
}
