import { notInArray, sql } from "drizzle-orm";
import { db, pool } from "../index";
import { countryNotes, souvenirs, souvenirTranslations } from "../schema";
import { allNotes, allSouvenirs } from "./all";
import { checkCatalogue } from "./check";

const BATCH = 200;

function* batches<T>(items: T[]): Generator<T[]> {
  for (let i = 0; i < items.length; i += BATCH) yield items.slice(i, i + BATCH);
}

/**
 * Loads the catalogue into the database. The files under db/seed are the
 * source of truth: entries are matched on `slug` and updated in place, and
 * souvenirs no longer present in the files are removed. Safe to re-run.
 */
async function main() {
  const problems = checkCatalogue();
  if (problems.length > 0) {
    throw new Error(`Catalogue check failed:\n${problems.join("\n")}`);
  }

  await db.transaction(async (tx) => {
    const ids = new Map<string, string>();

    for (const batch of batches(allSouvenirs)) {
      const rows = await tx
        .insert(souvenirs)
        .values(
          batch.map((entry) => ({
            slug: entry.slug,
            countryCode: entry.countryCode,
            region: entry.region ?? null,
            category: entry.category,
            priceTier: entry.priceTier,
            seasonMonths: entry.seasonMonths ?? [],
            ageGroups: entry.ageGroups,
            tags: entry.tags,
          })),
        )
        .onConflictDoUpdate({
          target: souvenirs.slug,
          set: {
            countryCode: sql`excluded.country_code`,
            region: sql`excluded.region`,
            category: sql`excluded.category`,
            priceTier: sql`excluded.price_tier`,
            seasonMonths: sql`excluded.season_months`,
            ageGroups: sql`excluded.age_groups`,
            tags: sql`excluded.tags`,
          },
        })
        .returning({ id: souvenirs.id, slug: souvenirs.slug });
      for (const row of rows) ids.set(row.slug, row.id);
    }

    for (const batch of batches(allSouvenirs)) {
      await tx
        .insert(souvenirTranslations)
        .values(
          batch.map((entry) => ({
            souvenirId: ids.get(entry.slug)!,
            locale: "en",
            name: entry.name,
            description: entry.description,
          })),
        )
        .onConflictDoUpdate({
          target: [souvenirTranslations.souvenirId, souvenirTranslations.locale],
          set: {
            name: sql`excluded.name`,
            description: sql`excluded.description`,
          },
        });
    }

    await tx.delete(souvenirs).where(
      notInArray(
        souvenirs.slug,
        allSouvenirs.map((entry) => entry.slug),
      ),
    );

    for (const batch of batches(allNotes)) {
      await tx
        .insert(countryNotes)
        .values(
          batch.map((note) => ({
            countryCode: note.code,
            locale: "en",
            knownFor: note.knownFor,
            goodToKnow: note.goodToKnow,
          })),
        )
        .onConflictDoUpdate({
          target: [countryNotes.countryCode, countryNotes.locale],
          set: {
            knownFor: sql`excluded.known_for`,
            goodToKnow: sql`excluded.good_to_know`,
          },
        });
    }
  });

  console.log(
    `Seeded ${allSouvenirs.length} souvenirs and notes for ${allNotes.length} countries.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
