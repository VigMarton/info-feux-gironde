/**
 * Source-drift checker — fetches every official URL cited in our content
 * and flags whether the page has changed since the last run.
 *
 * This is a *signal*, not a fact: a "CHANGED" line means "an editor should
 * go re-read this page and update verifiedAt / the claim text," never an
 * instruction to auto-update anything. Nothing here publishes on its own.
 * See `.cursor/rules/accuracy-no-misinformation.mdc`.
 *
 * Usage: npm run sources:check
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const contentRoot = fileURLToPath(new URL("../src/content/", import.meta.url));
const snapshotPath = fileURLToPath(new URL("./source-snapshots.json", import.meta.url));

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(contentRoot + relativePath, "utf8")) as T;
}

type LocalizedText = { fr: string; en: string };

interface UrlBearing {
  id?: string;
  sourceUrl?: string;
  officialUrl?: string;
  pdfUrl?: string;
  url?: string;
}

const files = [
  "situation/stats.json",
  "situation/headlines.json",
  "situation/official-links.json",
  "evacuation/areas.json",
  "evacuation/shelters.json",
  "evacuation/shelter-directory.json",
  "help/cards.json",
  "other/cards.json",
] as const;

function collectUrls(): Map<string, Set<string>> {
  const refs = new Map<string, Set<string>>();

  const addRef = (url: string | undefined, label: string) => {
    if (!url) return;
    if (!refs.has(url)) refs.set(url, new Set());
    refs.get(url)?.add(label);
  };

  for (const file of files) {
    if (file === "evacuation/shelter-directory.json") {
      const directory = readJson<UrlBearing & { entries?: { id: string }[] }>(file);
      addRef(directory.sourceUrl, `${file}#directory`);
      addRef(directory.pdfUrl, `${file}#pdf`);
      continue;
    }

    const items = readJson<(UrlBearing & { label?: LocalizedText })[]>(file);
    for (const item of items) {
      const label = item.id ?? item.label?.en ?? "?";
      addRef(item.sourceUrl, `${file}#${label}`);
      addRef(item.officialUrl, `${file}#${label}`);
      addRef(item.url, `${file}#${label}`);
    }
  }

  return refs;
}

interface Snapshot {
  hash: string;
  status: number;
  checkedAt: string;
}

const TLS_QUIRK_CODES = new Set([
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "CERT_UNTRUSTED",
]);

/**
 * Reduces a fetched page to its visible text before hashing. Raw HTML
 * hashing is too noisy: embedded widgets (social feeds, CSRF tokens,
 * cache-busting query strings in inline scripts) can change on every
 * request even when the actual published content hasn't, which would
 * otherwise spam editors with false "CHANGED" alerts.
 */
function extractVisibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWithTimeout(url: string, timeoutMs = 12_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  const refs = collectUrls();
  const previous: Record<string, Snapshot> = existsSync(snapshotPath)
    ? JSON.parse(readFileSync(snapshotPath, "utf8"))
    : {};
  const next: Record<string, Snapshot> = {};

  let changedCount = 0;
  let errorCount = 0;

  console.log(`Checking ${refs.size} unique official URLs referenced in content...\n`);

  for (const [url, labels] of refs) {
    const referencedBy = [...labels].join(", ");
    try {
      const res = await fetchWithTimeout(url);
      const html = await res.text();
      const visibleText = extractVisibleText(html);
      const hash = createHash("sha256").update(visibleText).digest("hex").slice(0, 16);
      next[url] = { hash, status: res.status, checkedAt: new Date().toISOString() };

      if (res.status >= 400) {
        console.log(`!! HTTP ${res.status}  ${url}`);
        console.log(`     referenced by: ${referencedBy}`);
        errorCount += 1;
      } else if (!previous[url]) {
        console.log(`NEW      ${url}`);
      } else if (previous[url].hash !== hash) {
        console.log(`CHANGED  ${url}`);
        console.log(`     referenced by: ${referencedBy}`);
        console.log(`     last checked: ${previous[url].checkedAt}`);
        changedCount += 1;
      } else {
        console.log(`ok       ${url}`);
      }
    } catch (error) {
      const cause = (error as { cause?: { code?: string } }).cause;
      if (cause?.code && TLS_QUIRK_CODES.has(cause.code)) {
        // Some .gouv.fr sites serve an incomplete certificate chain that
        // Node rejects but browsers tolerate — a Node/TLS quirk, not
        // necessarily a broken link. Don't fail the run on this alone;
        // just tell the editor to eyeball it in a real browser.
        console.log(`TLS-QUIRK ${url} — ${cause.code} (Node rejected the cert chain; try it in a browser)`);
        console.log(`     referenced by: ${referencedBy}`);
        if (previous[url]) next[url] = previous[url];
      } else {
        console.log(`ERROR    ${url} — ${(error as Error).message}`);
        console.log(`     referenced by: ${referencedBy}`);
        errorCount += 1;
        if (previous[url]) next[url] = previous[url];
      }
    }
  }

  writeFileSync(snapshotPath, JSON.stringify(next, null, 2) + "\n");

  console.log(
    `\nSummary: ${changedCount} page(s) changed since last check, ${errorCount} error(s)/broken link(s).`,
  );
  console.log("A 'CHANGED' page means: go re-read it and update the claim + verifiedAt if needed.");

  if (changedCount > 0 || errorCount > 0) {
    process.exitCode = 1;
  }
}

main();
