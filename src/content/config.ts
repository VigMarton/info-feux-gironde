import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import {
  areaSchema,
  changelogEntrySchema,
  headlineSchema,
  helpCardSchema,
  officialLinkSchema,
  otherCardSchema,
  shelterSchema,
  statSchema,
  toolSchema,
} from "./schemas";

/**
 * Collection wiring for Info Feux Gironde. Schemas live in `./schemas`
 * (see that file for the accuracy rationale) so they can be unit tested
 * without Astro's virtual `astro:content` module.
 */

const stats = defineCollection({
  loader: file("src/content/situation/stats.json"),
  schema: statSchema,
});

const headlines = defineCollection({
  loader: file("src/content/situation/headlines.json"),
  schema: headlineSchema,
});

const officialLinks = defineCollection({
  loader: file("src/content/situation/official-links.json"),
  schema: officialLinkSchema,
});

const tools = defineCollection({
  loader: file("src/content/situation/tools.json"),
  schema: toolSchema,
});

const areas = defineCollection({
  loader: file("src/content/evacuation/areas.json"),
  schema: areaSchema,
});

const shelters = defineCollection({
  loader: file("src/content/evacuation/shelters.json"),
  schema: shelterSchema,
});

const helpCards = defineCollection({
  loader: file("src/content/help/cards.json"),
  schema: helpCardSchema,
});

const otherCards = defineCollection({
  loader: file("src/content/other/cards.json"),
  schema: otherCardSchema,
});

const changelog = defineCollection({
  loader: file("src/content/site/changelog.json"),
  schema: changelogEntrySchema,
});

export const collections = {
  stats,
  headlines,
  officialLinks,
  tools,
  areas,
  shelters,
  helpCards,
  otherCards,
  changelog,
};
