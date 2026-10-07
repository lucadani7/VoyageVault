import { isCountryCode } from "@/lib/countries";
import {
  INTEREST_TAGS,
  PRICE_TIERS,
  SOUVENIR_CATEGORIES,
} from "@/lib/vocabulary";
import { allNotes, allSouvenirs } from "./all";

/** A country needs at least this many souvenirs to give a useful answer. */
const MIN_PER_COUNTRY = 4;

/**
 * Checks the whole catalogue without touching the database and returns a
 * list of problems (empty when everything is fine). Run by `pnpm db:check`
 * and again before every seed.
 */
export function checkCatalogue(): string[] {
  const problems: string[] = [];
  const tags = new Set<string>(INTEREST_TAGS);
  const categories = new Set<string>(SOUVENIR_CATEGORIES);
  const prices = new Set<string>(PRICE_TIERS);

  const noted = new Set<string>();
  for (const note of allNotes) {
    if (!isCountryCode(note.code)) problems.push(`${note.code}: unknown country code`);
    if (noted.has(note.code)) problems.push(`${note.code}: notes defined twice`);
    noted.add(note.code);
    if (note.knownFor.length < 15) problems.push(`${note.code}: "known for" is too short`);
    if (note.goodToKnow.length < 15) problems.push(`${note.code}: "good to know" is too short`);
  }

  const slugs = new Set<string>();
  const perCountry = new Map<string, number>();
  for (const entry of allSouvenirs) {
    const at = entry.slug;
    if (slugs.has(at)) problems.push(`${at}: duplicate slug`);
    slugs.add(at);

    if (!noted.has(entry.countryCode)) problems.push(`${at}: country ${entry.countryCode} has no notes`);
    if (!at.startsWith(`${entry.countryCode.toLowerCase()}-`)) problems.push(`${at}: slug does not start with its country code`);
    if (!categories.has(entry.category)) problems.push(`${at}: unknown category`);
    if (!prices.has(entry.priceTier)) problems.push(`${at}: unknown price tier`);
    if (entry.tags.length === 0) problems.push(`${at}: no tags`);
    for (const tag of entry.tags) {
      if (!tags.has(tag)) problems.push(`${at}: unknown tag "${tag}"`);
    }
    if (entry.ageGroups.length === 0) problems.push(`${at}: no age groups`);
    for (const month of entry.seasonMonths ?? []) {
      if (!Number.isInteger(month) || month < 1 || month > 12) problems.push(`${at}: invalid month ${month}`);
    }
    if (!entry.name.trim() || !entry.description.trim()) problems.push(`${at}: missing name or description`);

    // Alcohol must never be suggested for a child or a teenager.
    const forMinors = entry.ageGroups.includes("child") || entry.ageGroups.includes("teen");
    if (entry.category === "drink" && !entry.nonAlcoholic && forMinors) {
      problems.push(`${at}: a drink offered to minors must be marked non-alcoholic`);
    }

    perCountry.set(entry.countryCode, (perCountry.get(entry.countryCode) ?? 0) + 1);
  }

  for (const code of noted) {
    const count = perCountry.get(code) ?? 0;
    if (count < MIN_PER_COUNTRY) problems.push(`${code}: only ${count} souvenirs (minimum ${MIN_PER_COUNTRY})`);
  }

  return problems;
}

// When run directly: print a summary and fail loudly if anything is wrong.
if (process.argv[1]?.replace(/\.(ts|js)$/, "").endsWith("check")) {
  const problems = checkCatalogue();
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    console.error(`\n${problems.length} problem(s) found.`);
    process.exitCode = 1;
  } else {
    console.log(`Catalogue OK: ${allSouvenirs.length} souvenirs in ${allNotes.length} countries.`);
  }
}
