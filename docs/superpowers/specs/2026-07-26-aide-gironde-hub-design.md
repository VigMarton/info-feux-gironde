# Aide Gironde Hub — Design Spec

**Date:** 2026-07-26  
**Status:** Approved (pending user review of this file)  
**Working name:** Aide Gironde / Gironde Help Hub  
**Type:** Multilingual civic information hub (not an action/marketplace app)

## Problem

Ongoing Gironde wildfires have forced large-scale evacuations. People (residents and tourists) need a calm, multilingual place that routes them to **verified official information** without adding another fire-tracking app or unverified social feed.

## Goals

- Help users find the **correct next step** (shelter info, official orders, how to help, special needs) in FR/EN (ES/DE-ready).
- Prefer **official deep links and contacts** over restating volatile facts.
- Ship fast; keep ops simple for a small volunteer team.

## Non-goals

- Fire perimeter / live fire tracking
- In-app housing, volunteer, or donation matching
- User accounts or collecting sensitive PII
- AI chat that answers crisis questions from model knowledge
- Shelter open/full badges until a solid official/partner feed exists

## Accuracy principle (project law)

Wrong information can endanger people. See Cursor rule `.cursor/rules/accuracy-no-misinformation.mdc`.

**Fail closed:** If a fact is not 100% verifiable from a trusted official source, do not show it as fact — point to a source that may have valid info instead.

Source tiers for published facts: préfecture / FR-Alert / state (0), Métropole / mairies / official ops (1), aid orgs for their own guidance (2). Press and social are signal-only until confirmed.

## Product shape

A **hub** with triage jumps into problem groups. Actions happen on official sites/phones, not inside the app.

```text
[ Banner: unofficial civic hub · follow FR-Alert · last full check ]
[ Triage: Need shelter | Evacuated / orders | Want to help | Other ]

1. Current situation
2. Evacuation & shelters
3. I want to help
4. Other needs

[ Footer: how we verify · report outdated info · key official links ]
```

## Sections

### 1. Current fire situation

- At most ~5 timestamped stats (e.g. hectares, evacuated count, vigilance), each with source URL + “as of” datetime.
- 2–4 headline bullets only from Tier-0/1 sources, linked.
- “Latest developments” = pack of official links (préfecture, FR-Alert explainers, Métropole), not a scraped news ticker.
- No fire map; no auto-updated figures from press aggregation.
- Stale stats (>6 hours or past explicit expiry): hide the number, keep the official link.

### 2. Evacuation & shelters

**Evacuated areas**

- List communes/sectors with link to the relevant préfecture communiqué / FR-Alert guidance page.
- Prefer linking over claiming a perfect live list when waves move quickly.

**Shelters — mode A (v1, locked)**

For each shelter:

- Name, commune, address, map pin (e.g. OSM)
- Optional static notes only if Tier-0/1 stated them (e.g. “Métropole reports a pet area at Parc Expo”)
- Official source link and/or info phone numbers
- **No open / full / closed capacity badges**
- Fixed guidance: “Confirm on the official page or by phone before travelling”

**Shelters — mode B (later)**

Only enable availability status if:

1. A shared sheet/API from Métropole, mairie, or centre ops exists, **or**
2. Dual-human verification with short TTL (e.g. 2h) and fail-closed to “unknown” / link-only

Until then, UI may note that live capacity is not shown for safety.

### 3. I want to help

Cards with short explanation + trusted link + contact:

- Donate goods → mairie collection (explicitly: do not bring donations to Parc Expo if officials say so)
- Volunteer → mairie / Métropole form
- Offer housing → Métropole form; third-party tools (e.g. PrévEntraide) only if clearly labeled unofficial
- Green / info numbers (e.g. Métropole 0 800 006 090, public info cell) when verified

No in-app matching.

### 4. Other needs

Toolbox cards (tip + trusted link + contact), e.g.:

- Pets / animals
- Medical / meds / vulnerable persons (Protection Civile, ARS, emergency numbers — link, don’t diagnose)
- Transport / traffic (official open-data or institutional links)
- Tourists (language tips, official EN pages where available)
- Documents / insurance (light; phase 2 OK)

## Languages

- v1: French + English
- Structure ready for Spanish + German
- UI chrome translated; official place names remain in French

## Trust UX

- Persistent unofficial-hub banner
- Every dynamic block shows source + last verified
- Footer: “How we verify” + “Report outdated information” contact
- Kill switch: blank dynamic claims; retain emergency numbers + official links only

## Data & automation

| Mechanism | Role |
|---|---|
| Manual CMS / JSON content | Publishes verified cards and lists |
| Préfecture RSS + page change detection | Alerts editors only |
| Météo-France Météo des forêts API | Optional prevention context only — not evacuations/shelters |
| Scrapers / social / press | Never auto-publish crisis facts |

There is no public API for FR-Alert payloads or live shelter capacity suitable for auto-publish.

## Technical MVP (guidance)

- Static or lightly dynamic site (e.g. Astro or Next.js)
- Content as structured files or simple CMS
- Map embeds for addresses
- Deploy on a fast host (Vercel / Cloudflare Pages)
- No accounts; minimal analytics if any (privacy-preserving)

## Success criteria

- A stressed user reaches a correct official next step in under a minute
- Tourists get usable EN guidance without needing fluent French
- Hub never presents unverified capacity or return-home advice as fact
- Editors can update or kill dynamic content quickly

## Open follow-ups

- Exact shelter seed list from latest préfecture / Métropole pages at build time
- Whether ES/DE ship in the same MVP week
- Partner outreach for a future mode-B capacity feed
