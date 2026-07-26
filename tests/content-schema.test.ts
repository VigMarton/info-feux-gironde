import { describe, expect, it } from "vitest";
import {
  areaSchema,
  helpCardSchema,
  officialLinkSchema,
  otherCardSchema,
  shelterSchema,
  statSchema,
  toolSchema,
} from "../src/content/schemas";

const validShelter = {
  id: "parc-expo-bordeaux",
  name: "Parc des Expositions Bordeaux-Lac",
  commune: "Bordeaux",
  address: "Porte M, cours Jules Ladoumègue",
  lat: 44.894736,
  lon: -0.578519,
  officialUrl:
    "https://www.bordeaux-metropole.fr/actualites/incendies-en-gironde-accueil-personnes-evacuees-collecte-dons",
  sourceUrl:
    "https://www.bordeaux-metropole.fr/actualites/incendies-en-gironde-accueil-personnes-evacuees-collecte-dons",
  verifiedAt: "2026-07-26T12:00:00+02:00",
};

describe("shelterSchema (mode A — no capacity claims)", () => {
  it("accepts a well-formed shelter with no status/capacity field", () => {
    expect(() => shelterSchema.parse(validShelter)).not.toThrow();
  });

  it("rejects a shelter entry carrying a status field", () => {
    expect(() => shelterSchema.parse({ ...validShelter, status: "open" })).toThrow();
  });

  it("rejects a shelter entry carrying a capacity field", () => {
    expect(() => shelterSchema.parse({ ...validShelter, capacity: 10000 })).toThrow();
  });

  it("rejects a shelter missing verifiedAt", () => {
    const { verifiedAt, ...withoutVerifiedAt } = validShelter;
    expect(() => shelterSchema.parse(withoutVerifiedAt)).toThrow();
  });

  it("rejects a shelter with an invalid officialUrl", () => {
    expect(() => shelterSchema.parse({ ...validShelter, officialUrl: "not-a-url" })).toThrow();
  });
});

const fullLabel = { fr: "Personnes évacuées", en: "People evacuated", es: "Personas evacuadas", de: "Evakuierte Personen", nl: "Geëvacueerde personen" };
const fullValue = { fr: "220 000", en: "220,000", es: "220.000", de: "220.000", nl: "220.000" };

describe("statSchema", () => {
  it("accepts a stat with a sourceUrl and verifiedAt", () => {
    expect(() =>
      statSchema.parse({
        id: "evacuated",
        label: fullLabel,
        value: fullValue,
        sourceUrl: "https://www.gironde.gouv.fr/",
        verifiedAt: "2026-07-26T12:00:00+02:00",
      }),
    ).not.toThrow();
  });

  it("rejects a stat missing a sourceUrl", () => {
    expect(() =>
      statSchema.parse({
        id: "evacuated",
        label: fullLabel,
        value: fullValue,
        verifiedAt: "2026-07-26T12:00:00+02:00",
      }),
    ).toThrow();
  });

  it("rejects a stat missing a translation (es/de/nl now required, not just fr/en)", () => {
    expect(() =>
      statSchema.parse({
        id: "evacuated",
        label: { fr: "Personnes évacuées", en: "People evacuated" },
        value: fullValue,
        sourceUrl: "https://www.gironde.gouv.fr/",
        verifiedAt: "2026-07-26T12:00:00+02:00",
      }),
    ).toThrow();
  });
});

describe("officialLinkSchema", () => {
  const linkLabel = {
    fr: "Préfecture de la Gironde",
    en: "Gironde Prefecture",
    es: "Prefectura de la Gironda",
    de: "Präfektur der Gironde",
    nl: "Prefectuur van de Gironde",
  };

  it("accepts tier 0, 1, and 2", () => {
    for (const tier of [0, 1, 2] as const) {
      expect(() =>
        officialLinkSchema.parse({
          id: `link-${tier}`,
          label: linkLabel,
          url: "https://www.gironde.gouv.fr/",
          tier,
        }),
      ).not.toThrow();
    }
  });

  it("rejects an out-of-range tier", () => {
    expect(() =>
      officialLinkSchema.parse({
        id: "link-3",
        label: linkLabel,
        url: "https://www.gironde.gouv.fr/",
        tier: 3,
      }),
    ).toThrow();
  });
});

describe("toolSchema", () => {
  const toolLabel = { fr: "FR-Alert", en: "FR-Alert", es: "FR-Alert", de: "FR-Alert", nl: "FR-Alert" };
  const toolHint = {
    fr: "Comment recevoir les alertes",
    en: "How alerts work",
    es: "Cómo funcionan las alertas",
    de: "So funktionieren Alerts",
    nl: "Hoe meldingen werken",
  };

  it("accepts a Tier-0/1 tool without verifiedAt", () => {
    expect(() =>
      toolSchema.parse({
        id: "tool-fr-alert",
        label: toolLabel,
        hint: toolHint,
        url: "https://www.fr-alert.gouv.fr/",
        tier: 0,
      }),
    ).not.toThrow();
  });

  it("rejects Tier-2 tools in the official-tools strip", () => {
    expect(() =>
      toolSchema.parse({
        id: "tool-ngo",
        label: toolLabel,
        hint: toolHint,
        url: "https://www.croix-rouge.fr/",
        tier: 2,
      }),
    ).toThrow();
  });
});

describe("areaSchema", () => {
  it("requires a translation in every supported language", () => {
    expect(() =>
      areaSchema.parse({
        id: "cestas",
        commune: "Cestas",
        description: { fr: "Évacuation totale de la commune." },
        sourceUrl: "https://www.gironde.gouv.fr/",
        verifiedAt: "2026-07-26T12:00:00+02:00",
      }),
    ).toThrow();
  });
});

describe("helpCardSchema and otherCardSchema", () => {
  const title = { fr: "Devenir bénévole", en: "Volunteer", es: "Ser voluntario", de: "Freiwillig helfen", nl: "Vrijwilliger worden" };
  const description = {
    fr: "Contactez votre mairie.",
    en: "Contact your local town hall.",
    es: "Contacte con su ayuntamiento.",
    de: "Wenden Sie sich an Ihr Rathaus.",
    nl: "Neem contact op met uw gemeentehuis.",
  };
  const actionLabel = {
    fr: "Contacter la mairie",
    en: "Contact the town hall",
    es: "Contactar con el ayuntamiento",
    de: "Rathaus kontaktieren",
    nl: "Neem contact op met het gemeentehuis",
  };

  it("accepts a help card with either a url or a phone", () => {
    expect(() =>
      helpCardSchema.parse({
        id: "volunteer",
        title,
        description,
        actionLabel,
        phone: "0800006090",
        sourceUrl: "https://www.bordeaux-metropole.fr/actualites/incendies-en-gironde-accueil-personnes-evacuees-collecte-dons",
        verifiedAt: "2026-07-26T12:00:00+02:00",
      }),
    ).not.toThrow();
  });

  it("rejects an other-card with a category outside the fixed enum", () => {
    expect(() =>
      otherCardSchema.parse({
        id: "housing",
        category: "housing",
        title,
        description,
        actionLabel,
        sourceUrl: "https://www.bordeaux-metropole.fr/",
        verifiedAt: "2026-07-26T12:00:00+02:00",
      }),
    ).toThrow();
  });
});
