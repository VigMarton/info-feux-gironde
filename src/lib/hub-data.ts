import { getCollection } from "astro:content";
import meta from "../content/site/meta.json";
import shelterDirectoryRaw from "../content/evacuation/shelter-directory.json";
import { shelterDirectorySchema } from "../content/schemas";
import { filterFresh } from "./freshness";
import { groupByCategory } from "./group";

/** Shared content load for hub pages. Does not change verification timestamps. */
export async function loadHubData() {
  const killSwitch = meta.killSwitch;

  const statEntries = await getCollection("stats");
  const freshStats = killSwitch ? [] : filterFresh(statEntries.map((entry) => entry.data));

  const headlineEntries = killSwitch ? [] : await getCollection("headlines");
  const headlines = headlineEntries.map((entry) => entry.data);

  const officialLinkEntries = await getCollection("officialLinks");
  const officialLinks = officialLinkEntries.map((entry) => entry.data);

  const areaEntries = killSwitch ? [] : await getCollection("areas");
  /** Newest first — matches préfecture evacuation timeline (reversed). */
  const areaTimelineOrder = [
    "haillan-eysines-merignac-extra-rocade",
    "lacanau-campings-tourisme",
    "marcheprime-le-barp-biganos-mios-cestas",
    "st-aubin-st-medard-martignas-st-jean-dillac",
    "cap-ferret-peninsula-villages",
    "le-porge-saumos-le-temple-lege-cap-ferret",
  ] as const;
  const areas = areaEntries
    .map((entry) => entry.data)
    .sort((a, b) => {
      const ai = areaTimelineOrder.indexOf(a.id as (typeof areaTimelineOrder)[number]);
      const bi = areaTimelineOrder.indexOf(b.id as (typeof areaTimelineOrder)[number]);
      const aRank = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
      const bRank = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
      return aRank - bRank;
    });

  const shelterEntries = await getCollection("shelters");
  const shelters = shelterEntries.map((entry) => entry.data);

  const helpEntries = await getCollection("helpCards");
  const helpCards = helpEntries.map((entry) => entry.data);

  const otherEntries = await getCollection("otherCards");
  const otherCards = otherEntries.map((entry) => entry.data);
  const otherGroups = groupByCategory(otherCards);

  const changelogEntries = await getCollection("changelog");
  const changelog = changelogEntries
    .map((entry) => entry.data)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const toolEntries = await getCollection("tools");
  const tools = toolEntries.map((entry) => entry.data);

  const shelterDirectory = shelterDirectorySchema.parse(shelterDirectoryRaw);
  const alertStat = freshStats.find((stat) => stat.id === "alert-level");

  return {
    killSwitch,
    freshStats,
    headlines,
    officialLinks,
    areas,
    shelters,
    helpCards,
    otherGroups,
    changelog,
    tools,
    shelterDirectory,
    alertStat,
  };
}
