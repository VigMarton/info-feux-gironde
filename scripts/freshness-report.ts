/**
 * Freshness report — tells editors what's about to go stale.
 *
 * The site already hides any fact once it's no longer fresh (see
 * `src/lib/freshness.ts`); this script surfaces that *before* it happens
 * so an editor can re-verify (or let it expire, which fails closed).
 *
 * Usage: npm run freshness:check
 * Exits non-zero if anything has already expired, so it can be wired into
 * a cron/CI job that pings a human without publishing anything itself.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DEFAULT_MAX_AGE_MS, isFresh } from "../src/lib/freshness";

const contentRoot = fileURLToPath(new URL("../src/content/", import.meta.url));

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(contentRoot + relativePath, "utf8")) as T;
}

interface VerifiableItem {
  id: string;
  verifiedAt: string;
  expiresAt?: string;
}

interface SiteMeta {
  lastFullCheck: string;
  killSwitch: boolean;
}

const meta = readJson<SiteMeta>("site/meta.json");

const collections: { name: string; items: VerifiableItem[] }[] = [
  { name: "situation/stats.json", items: readJson("situation/stats.json") },
  { name: "situation/headlines.json", items: readJson("situation/headlines.json") },
  { name: "evacuation/areas.json", items: readJson("evacuation/areas.json") },
  { name: "evacuation/shelters.json", items: readJson("evacuation/shelters.json") },
  { name: "help/cards.json", items: readJson("help/cards.json") },
  { name: "other/cards.json", items: readJson("other/cards.json") },
];

const SOON_THRESHOLD_MS = 60 * 60 * 1000; // flag anything expiring within 1h

function formatHours(ms: number): string {
  return (ms / (60 * 60 * 1000)).toFixed(1);
}

function main(): void {
  const now = new Date();
  let expiredCount = 0;
  let dueSoonCount = 0;
  let itemCount = 0;

  console.log(`Freshness report — ${now.toISOString()}`);
  console.log(`Kill switch: ${meta.killSwitch ? "ON (dynamic claims hidden on site)" : "off"}`);
  console.log(`Last full check (site banner): ${meta.lastFullCheck}\n`);

  for (const { name, items } of collections) {
    if (items.length === 0) continue;
    console.log(`## ${name}`);

    for (const item of items) {
      itemCount += 1;
      const verifiedAt = new Date(item.verifiedAt);
      const fresh = isFresh(item, now);
      const ageMs = now.getTime() - verifiedAt.getTime();
      const deadline = item.expiresAt
        ? new Date(item.expiresAt)
        : new Date(verifiedAt.getTime() + DEFAULT_MAX_AGE_MS);
      const msToDeadline = deadline.getTime() - now.getTime();

      let status: string;
      if (!fresh) {
        status = "EXPIRED — already hidden on site; re-verify or remove";
        expiredCount += 1;
      } else if (msToDeadline < SOON_THRESHOLD_MS) {
        status = `expires in ${formatHours(msToDeadline)}h — re-verify soon`;
        dueSoonCount += 1;
      } else {
        status = `fresh (expires in ${formatHours(msToDeadline)}h)`;
      }

      console.log(`  - ${item.id.padEnd(42)} verified ${formatHours(ageMs)}h ago — ${status}`);
    }
    console.log("");
  }

  console.log(
    `Summary: ${itemCount} verifiable items — ${expiredCount} expired, ${dueSoonCount} expiring within 1h.`,
  );

  if (expiredCount > 0) {
    console.log(
      "\nAt least one fact is already stale. This is fail-closed working as intended (it's",
      "hidden on the live site), but re-verify or remove it from the JSON when you can.",
    );
    process.exitCode = 1;
  }
}

main();
