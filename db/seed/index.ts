import { sql } from "drizzle-orm";
import { db, pool } from "../index";
import { souvenirs, souvenirTranslations } from "../schema";
import { catalog } from "./catalog";

/**
 * Loads the souvenir catalogue. Safe to run repeatedly: entries are matched
 * on `slug` and updated in place, so editing catalog.ts and re-running is the
 * normal way to change the catalogue.
 */
async function main() {
  const slugs = new Set<string>();
  for (const entry of catalog) {
    if (slugs.has(entry.slug)) throw new Error(`Duplicate slug: ${entry.slug}`);
    slugs.add(entry.slug);
  }

  await db.transaction(async (tx) => {
    for (const entry of catalog) {
      const values = {
        slug: entry.slug,
        countryCode: entry.countryCode,
        region: entry.region ?? null,
        category: entry.category,
        priceTier: entry.priceTier,
        seasonMonths: entry.seasonMonths ?? [],
        ageGroups: entry.ageGroups,
        tags: entry.tags,
      };
      const [row] = await tx
        .insert(souvenirs)
        .values(values)
        .onConflictDoUpdate({ target: souvenirs.slug, set: values })
        .returning({ id: souvenirs.id });

      await tx
        .insert(souvenirTranslations)
        .values({
          souvenirId: row.id,
          locale: "en",
          name: entry.name,
          description: entry.description,
        })
        .onConflictDoUpdate({
          target: [souvenirTranslations.souvenirId, souvenirTranslations.locale],
          set: { name: entry.name, description: entry.description },
        });
    }
  });

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(souvenirs);
  console.log(`Seeded ${catalog.length} souvenirs (${count} in database).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
