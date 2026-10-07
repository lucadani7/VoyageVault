import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { countryNotes, souvenirs, souvenirTranslations } from "@/db/schema";
import { isCountryCode, listCountries } from "./countries";

/** Countries the catalogue covers, as { code, name }, sorted by name. */
export async function getCataloguedCountries(locale = "en") {
  const rows = await db
    .selectDistinct({ code: countryNotes.countryCode })
    .from(countryNotes);
  const covered = new Set(rows.map((row) => row.code));
  return listCountries(locale).filter((country) => covered.has(country.code));
}

/** One country's notes and all of its souvenirs, or null if not covered. */
export async function getCountryCatalogue(countryCode: string, locale = "en") {
  if (!isCountryCode(countryCode)) return null;

  const [notes] = await db
    .select()
    .from(countryNotes)
    .where(
      and(
        eq(countryNotes.countryCode, countryCode),
        eq(countryNotes.locale, locale),
      ),
    );
  if (!notes) return null;

  const items = await db
    .select({
      id: souvenirs.id,
      region: souvenirs.region,
      category: souvenirs.category,
      priceTier: souvenirs.priceTier,
      seasonMonths: souvenirs.seasonMonths,
      ageGroups: souvenirs.ageGroups,
      tags: souvenirs.tags,
      name: souvenirTranslations.name,
      description: souvenirTranslations.description,
    })
    .from(souvenirs)
    .innerJoin(
      souvenirTranslations,
      and(
        eq(souvenirTranslations.souvenirId, souvenirs.id),
        eq(souvenirTranslations.locale, locale),
      ),
    )
    .where(eq(souvenirs.countryCode, countryCode))
    .orderBy(asc(souvenirTranslations.name));

  return { notes, items };
}
