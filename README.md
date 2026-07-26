# Info Feux Gironde

A multilingual (FR/EN/ES/DE/NL), static civic hub that routes people affected
by the Gironde wildfires to verified official sources — current situation,
evacuation & shelters, how to help, and other needs — without ever
publishing an unverifiable crisis fact as certain.

**Live:** [https://info-feux-gironde.com](https://info-feux-gironde.com)

**This is an unofficial, non-commercial citizen tool.** In an emergency,
follow FR-Alert and préfecture instructions, not this site.

## Why it exists

Official sources (préfecture, Bordeaux Métropole, FR-Alert, accredited aid
organisations) publish accurate information, but it's scattered across many
pages. This hub is a fast, calm index into that information — grouped by
what someone actually needs — that fails closed: if a fact can't be
verified against a trusted source right now, we link to the source instead
of guessing.

See [`docs/superpowers/specs/2026-07-26-aide-gironde-hub-design.md`](docs/superpowers/specs/2026-07-26-aide-gironde-hub-design.md)
for the full design rationale and
[`.cursor/rules/accuracy-no-misinformation.mdc`](.cursor/rules/accuracy-no-misinformation.mdc)
for the accuracy rules every change must follow.

## Stack

Astro 5 (static output) + TypeScript + Zod content schemas + Vitest +
Cloudflare Pages. No backend, no accounts, no client-side data collection.

## Getting started

```bash
npm install
cp .env.example .env   # set a real PUBLIC_CONTACT_EMAIL before shipping
npm run dev            # http://localhost:4321
```

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Local dev server with hot reload |
| `npm test` | Vitest unit tests (freshness logic + content schemas) |
| `npm run build` | `astro check` (type + content-schema validation) then static build to `dist/` |
| `npm run verify` | Tests + build — run this before every deploy |
| `npm run preview` | Serve the built `dist/` locally |

## Editing published content

All facts live in typed JSON under `src/content/`. **Read
[`docs/EDITORS.md`](docs/EDITORS.md) before changing any content file** — it
covers required verification fields, the shelter "mode A" rule (no
open/full/closed status, ever), and the kill switch.

## Deploying

```bash
npm run build
npx wrangler pages deploy dist --project-name=info-feux-gironde
```
