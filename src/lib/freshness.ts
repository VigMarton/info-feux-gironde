/**
 * Fail-closed freshness checks for verifiable crisis facts.
 *
 * A fact is only ever rendered as current if it is provably fresh: either
 * before an explicit `expiresAt`, or within `DEFAULT_MAX_AGE_MS` of its
 * `verifiedAt` when no explicit expiry is set. Any unparseable or missing
 * date is treated as stale — never as fresh. See
 * `.cursor/rules/accuracy-no-misinformation.mdc`.
 */

export interface Verifiable {
  /** ISO 8601 datetime when this fact was last confirmed against a Tier-0/1 source. */
  verifiedAt: string;
  /** ISO 8601 datetime after which this fact must no longer be shown as current. */
  expiresAt?: string;
}

/** Default max age for facts without an explicit `expiresAt`, per the spec (6 hours). */
export const DEFAULT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

function toValidDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function isFresh(item: Verifiable, now: Date = new Date()): boolean {
  const verifiedAt = toValidDate(item.verifiedAt);
  if (!verifiedAt) return false;

  if (item.expiresAt !== undefined) {
    const expiresAt = toValidDate(item.expiresAt);
    if (!expiresAt) return false;
    return now.getTime() < expiresAt.getTime();
  }

  return now.getTime() - verifiedAt.getTime() < DEFAULT_MAX_AGE_MS;
}

export function filterFresh<T extends Verifiable>(items: readonly T[], now: Date = new Date()): T[] {
  return items.filter((item) => isFresh(item, now));
}
