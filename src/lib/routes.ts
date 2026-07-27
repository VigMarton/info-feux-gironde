import type { Locale } from "../i18n";

/** Path segment after `/{locale}/`. Empty string = home. */
export type PageSegment = "" | "situation" | "evacuation" | "help" | "other";

export const PAGE_SEGMENTS: PageSegment[] = ["", "situation", "evacuation", "help", "other"];

export function localePath(locale: Locale, segment: PageSegment = ""): string {
  return segment ? `/${locale}/${segment}/` : `/${locale}/`;
}
