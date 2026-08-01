import { z } from "zod";

/**
 * Content schemas for Info Feux Gironde, kept free of any Astro virtual
 * imports so they can be unit tested directly with Vitest.
 *
 * Every collection represents facts that will be rendered to people making
 * real safety decisions. Schemas are intentionally `.strict()` so that
 * unexpected fields fail the build instead of silently reaching the UI —
 * most importantly, shelter entries can never carry a `status` or
 * `capacity` field: v1 ships "mode A" only (address + official link, no
 * open/full/closed badges). See
 * `.cursor/rules/accuracy-no-misinformation.mdc` and
 * `docs/superpowers/specs/2026-07-26-aide-gironde-hub-design.md`.
 */

export const localizedText = z.object({
  fr: z.string().min(1),
  en: z.string().min(1),
  es: z.string().min(1),
  de: z.string().min(1),
  nl: z.string().min(1),
});

/** Every published fact must say where it came from and when it was confirmed. */
const verifiable = {
  sourceUrl: z.string().url(),
  verifiedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }).optional(),
};

export const statSchema = z
  .object({
    id: z.string(),
    label: localizedText,
    value: localizedText,
    ...verifiable,
  })
  .strict();

export const headlineSchema = z
  .object({
    id: z.string(),
    text: localizedText,
    sourceName: z.string().min(1),
    /**
     * When the underlying official update happened — used to sort
     * “previous updates” newest-first. Distinct from `verifiedAt`
     * (when we last checked the claim).
     */
    occurredAt: z.string().datetime({ offset: true }),
    ...verifiable,
  })
  .strict();

export const officialLinkSchema = z
  .object({
    id: z.string(),
    label: localizedText,
    url: z.string().url(),
    /** 0 = state/préfecture, 1 = local authority ops, 2 = accredited aid org. */
    tier: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  })
  .strict();

/**
 * Compact "official tools" strip entries — navigational deep-links only
 * (Tier 0/1/2). Not crisis facts, so no verifiedAt; keep the list short.
 */
export const toolSchema = z
  .object({
    id: z.string(),
    label: localizedText,
    hint: localizedText,
    url: z.string().url(),
    tier: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  })
  .strict();

export const areaSchema = z
  .object({
    id: z.string(),
    commune: z.string().min(1),
    description: localizedText,
    ...verifiable,
  })
  .strict();

/**
 * Shelter schema — "mode A" only. Deliberately has no `status` or
 * `capacity` field, and `.strict()` rejects any attempt to add one.
 *
 * `lat`/`lon` are optional and must only be set when an official source
 * explicitly publishes exact coordinates (e.g. a préfecture communiqué
 * with a GPS point). Do not geocode/estimate coordinates yourself — when
 * no official coordinates exist, leave them unset; the UI builds a map
 * search link from the verified `address` text instead.
 */
export const shelterSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    commune: z.string().min(1),
    address: z.string().min(1),
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
    notes: localizedText.optional(),
    officialUrl: z.string().url(),
    ...verifiable,
  })
  .strict();

/**
 * Full préfecture directory (PDF) as place + address rows only — never
 * open/full/capacity. Shown behind a disclosure; re-checked against the
 * Tier-0 PDF on every freshness pass.
 */
export const shelterDirectoryEntrySchema = z
  .object({
    id: z.string(),
    commune: z.string().min(1),
    place: z.string().min(1),
  })
  .strict();

export const shelterDirectorySchema = z
  .object({
    /** Official PDF when published; otherwise omit and use sourceUrl (HTML list). */
    pdfUrl: z.string().url().optional(),
    officialAsOf: localizedText,
    entries: z.array(shelterDirectoryEntrySchema).min(1),
    ...verifiable,
  })
  .strict();

export type ShelterDirectory = z.infer<typeof shelterDirectorySchema>;

export const helpCardSchema = z
  .object({
    id: z.string(),
    title: localizedText,
    description: localizedText,
    actionLabel: localizedText,
    url: z.string().url().optional(),
    phone: z.string().min(1).optional(),
    ...verifiable,
  })
  .strict();

export const otherCardSchema = z
  .object({
    id: z.string(),
    category: z.enum(["pets", "medical", "transport", "tourists", "documents"]),
    title: localizedText,
    description: localizedText,
    actionLabel: localizedText,
    url: z.string().url().optional(),
    phone: z.string().min(1).optional(),
    ...verifiable,
  })
  .strict();

/**
 * Changelog entries describe what *we* changed on the site and when — a
 * transparency/trust feature, not a crisis fact. It still needs a real
 * ISO timestamp so it sorts and displays correctly, but does not require
 * an external `sourceUrl` since it documents our own editing activity.
 */
export const changelogEntrySchema = z
  .object({
    id: z.string(),
    date: z.string().datetime({ offset: true }),
    summary: localizedText,
  })
  .strict();
