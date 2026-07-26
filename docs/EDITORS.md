# Editor runbook — Info Feux Gironde

This site has no admin panel and no backend. Every fact on the page comes
from a JSON file in `src/content/`. To change what's published, edit those
files, then build/deploy (see "Deploying" below). **Read
[`.cursor/rules/accuracy-no-misinformation.mdc`](../.cursor/rules/accuracy-no-misinformation.mdc)
before you start** — it is the law of this project, not a suggestion.

## The one rule that matters

**If you can't point at an official (Tier‑0/1) URL that says the thing you
want to publish, don't publish it.** Add the official link instead and let
people confirm for themselves. See the "source tiers" table in the accuracy
rule for what counts as Tier‑0/1/2/3.

## Where content lives

| File | Powers | Collection schema |
|---|---|---|
| `src/content/site/meta.json` | `lastFullCheck` banner timestamp, kill switch | plain JSON, no schema |
| `src/content/situation/stats.json` | Verified-figure cards | `statSchema` |
| `src/content/situation/headlines.json` | "Latest situation updates" bullets | `headlineSchema` |
| `src/content/situation/official-links.json` | "Follow the latest developments" link pack | `officialLinkSchema` |
| `src/content/evacuation/areas.json` | Evacuated-area list | `areaSchema` |
| `src/content/evacuation/shelters.json` | Featured reception-centre cards | `shelterSchema` |
| `src/content/evacuation/shelter-directory.json` | Full préfecture PDF list (disclosure table) | `shelterDirectorySchema` |
| `src/content/help/cards.json` | "I want to help" cards | `helpCardSchema` |
| `src/content/other/cards.json` | "Other needs" cards | `otherCardSchema` |

All schemas live in `src/content/schemas.ts` and are wired into collections
in `src/content/config.ts`. Every collection is `.strict()` — an unknown
field fails the build instead of silently reaching the page.

## Required fields on every fact

Almost every item needs:

- `sourceUrl` — the exact page you checked (not just the domain).
- `verifiedAt` — ISO datetime (with timezone offset, e.g.
  `2026-07-26T16:45:00+02:00`) of when *you personally* confirmed this
  against the source. Not when the event happened — when you checked it.
- `expiresAt` (optional) — set this if you know exactly when the fact stops
  being true (e.g. a temporary road closure end time). If unset, the fact
  is treated as fresh for **6 hours** from `verifiedAt` (see
  `src/lib/freshness.ts`), then automatically hidden from the page — the
  official link stays, the claim disappears. This is intentional: **re-verify
  and update `verifiedAt` at least every few hours**, or let it expire.

## Adding/updating each content type

- **Stats** (`stats.json`): keep this list short (ideally ≤5). Only add a
  number you can attribute to a live Tier-0/1 page *right now*. If the
  official figure is already hours old when you check it, prefer a
  headline (dated, in prose) over a stat card (which reads as "current").
- **Headlines** (`headlines.json`): 2-4 short, dated bullets. Always name
  the date/time the event happened inside the text itself (e.g. "25
  juillet : ...") so readers know it's historical, not live.
- **Official links** (`official-links.json`): stable navigational links
  only (préfecture, FR-Alert, Bordeaux Métropole, Météo des forêts, etc).
  Pick `tier` 0 (state), 1 (local authority ops), or 2 (accredited aid org).
- **Evacuation areas** (`areas.json`): one entry per evacuation order/zone,
  citing the exact préfecture communiqué that ordered it.
- **Shelters** (`shelters.json`) — see the dedicated section below.
- **Help / Other cards** (`help/cards.json`, `other/cards.json`): short
  action cards with an optional `url` and/or `phone`. `category` on other-cards
  must be one of `pets | medical | transport | tourists | documents`.

## Shelters: never add status or capacity

`shelterSchema` **has no `status` or `capacity` field on purpose**, and
`.strict()` will fail the build if you add one (see
`tests/content-schema.test.ts` for the tests that lock this in). This is
"mode A": address + official link + map, no "open/full/closed" badge.

- Featured detail cards live in `shelters.json` (currently Bordeaux-Lac).
- The **full directory** is `shelter-directory.json`: place + address rows
  copied from the Tier‑0 préfecture PDF only. UI: collapsible “See full
  list” table. No status, no capacity, no geocoding.
- On every `npm run freshness:check`, open the PDF linked as `pdfUrl` and
  compare **every** Lieu / Adresse row to `entries`. If the préfecture
  published a new PDF, update `pdfUrl`, rewrite `entries` to match, update
  `officialAsOf`, and bump `verifiedAt`. If you cannot verify → let the
  table expire (fail closed); the official PDF/page links stay.
- Landing page for the current PDF:
  `https://www.gironde.gouv.fr/Actualites/Breves/Incendie-Centres-d-accueil`
- `lat`/`lon` on featured cards are **optional**. Only fill them when an
  official source explicitly publishes exact coordinates (as for the Parc
  des Expositions: `GPS : 44.894736, -0.578519`). **Never geocode or
  estimate coordinates yourself.** If you don't have official coordinates,
  leave `lat`/`lon` unset — the UI builds a map search link from the
  verified `address` text instead (see `mapUrl` in `src/lib/links.ts`).
- `notes` (optional) should only hold facts you can verify — e.g.
  "showers available at X", not anything about current occupancy.

## The kill switch

`src/content/site/meta.json` → `"killSwitch": true` is the emergency
"we're not confident in our data right now" switch. When it's `true`:

- Situation stats and headlines are hidden entirely (a "simplified view"
  notice + the official-links pack still show).
- The evacuation areas list is hidden.
- Shelter cards keep their address, map link, and official link, but their
  free-text `notes` are hidden.
- Help/other cards, the triage nav, emergency phone numbers, and every
  official link are **never** affected — they're pure deep-links, not
  claims we're making ourselves.

Flip it back to `false` as soon as you've re-verified the content. Toggling
it doesn't require deleting any JSON — it's a single boolean.

## Keeping content up to date

Two scripts exist specifically to answer "does anything need attention right
now?" — run them, don't just eyeball it:

```bash
npm run freshness:check   # what's about to expire on the live site
npm run sources:check     # did any cited official page change since we last read it?
```

- **`freshness:check`** reads every item's `verifiedAt`/`expiresAt` and
  reports what's fresh, what expires within the hour, and what's already
  expired (already hidden on the live site — that's fail-closed working as
  intended, but it means someone should re-verify or delete the entry).
- **`sources:check`** fetches every official URL cited anywhere in
  `src/content/`, hashes the visible text, and diffs it against the last
  run (stored in `scripts/source-snapshots.json`, which is committed so you
  get a history of when official pages changed). A `CHANGED` line is a
  **signal to go re-read that page**, not a fact — never treat "unchanged"
  as proof something is still accurate, and never treat "changed" as proof
  something is now wrong. A `TLS-QUIRK` line means Node's strict cert
  validation rejected a page's certificate chain (this happens on a few
  `.gouv.fr` sites); it is not necessarily a broken link — open it in a
  real browser to check.

### Recommended cadence during an active "vigilance rouge/noire" episode

- Re-run both scripts and re-check the situation/evacuation sections at
  least every **2–3 hours** — comfortably inside the 6h auto-expiry window,
  so nothing goes stale on the live site between your checks.
- After each check, update `verifiedAt` on anything you re-confirmed (even
  if the text didn't change) and bump `src/content/site/meta.json` →
  `lastFullCheck`.
- If you can't do a check in time and the situation is moving fast, flip
  `killSwitch: true` rather than let stats/headlines/areas silently expire
  one by one — it's one deliberate action instead of an accumulating gap.
- Once the fire is fixed/contained and evacuation orders are lifted, do one
  final full pass, then consider archiving the evacuation/help content
  entirely rather than leaving a quiet "nothing found" hub up.
- Consider wiring `npm run freshness:check` (exits non-zero on expired
  content) and `npm run sources:check` (exits non-zero on changes/errors)
  into a scheduled job (cron, GitHub Action, or a Cursor Automation) that
  notifies a human editor — per the accuracy rule, automation may **alert**,
  it must never publish on its own.

## Before you ship a change

```bash
npm test          # freshness + schema unit tests (Vitest)
npm run build     # astro check (type + content-schema validation) + astro build
```

Both must pass. `astro check` will fail the build if any JSON file doesn't
match its Zod schema (e.g. a stray `status` field on a shelter, a missing
`sourceUrl`, a malformed URL).

## Deploying

The site is a static Astro build deployed to Cloudflare Pages
(`wrangler.toml`, output directory `dist/`).

```bash
npm run build
npx wrangler pages deploy dist --project-name=info-feux-gironde
```

The "report outdated information" footer link only renders once
`PUBLIC_CONTACT_EMAIL` is set to a real, monitored mailbox (not the
`corrections@example.org` placeholder) — see `.env.example` and
`SiteFooter.astro`. Until then it stays hidden rather than showing a
broken/fake contact address.

## Explicitly out of scope for now

Don't add these without a deliberate follow-up decision (see the plan's
"explicitly deferred" list): shelter open/full status (mode B), ES/DE
translations, an automated RSS/press watcher, a Météo des forêts API
integration, or a partner capacity feed.
