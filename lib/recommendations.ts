import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  countryNotes,
  recommendations,
  souvenirs,
  souvenirTranslations,
} from "@/db/schema";
import { ANYWHERE } from "./countries";
import { explain } from "./recommender/explain";
import {
  pickVaried,
  rankSouvenirs,
  type ScorableSouvenir,
} from "./recommender/score";
import { getRecipients } from "./recipients";
import { getTrip } from "./trips";

/** How many fresh suggestions to show per person and stop. */
export const SUGGESTIONS_PER_PERSON = 5;

type CatalogueSouvenir = ScorableSouvenir & { name: string; description: string };

export type RecommendationItem = {
  souvenirId: string;
  name: string;
  description: string;
  priceTier: CatalogueSouvenir["priceTier"];
  score: number;
  /** Why it was suggested, already worded for display. */
  reasons: string[];
  outOfSeason: boolean;
};

/** Souvenirs of the given countries, with their text in one language. */
async function getSouvenirs(countryCodes: string[], locale = "en") {
  const rows = await db
    .select({
      id: souvenirs.id,
      countryCode: souvenirs.countryCode,
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
    .where(inArray(souvenirs.countryCode, [...countryCodes, ANYWHERE]));
  return rows satisfies CatalogueSouvenir[];
}

/**
 * Everything the recommendations page shows for one trip: for each stop and
 * each person, what was bought, what is suggested and what was dismissed.
 *
 * Suggestions are computed on every request from the current catalogue and
 * profiles, so they are never stale; only the user's own decisions (bought,
 * dismissed) are stored.
 */
export async function getTripRecommendations(userId: string, tripId: string) {
  const trip = await getTrip(userId, tripId);
  if (!trip) return null;

  const people = await getRecipients(userId);
  const stopIds = trip.stops.map((stop) => stop.id);
  const countryCodes = [...new Set(trip.stops.map((stop) => stop.countryCode))];

  if (stopIds.length === 0) return { trip, people, stops: [] };

  const [catalogue, notes, saved] = await Promise.all([
    getSouvenirs(countryCodes),
    db
      .select()
      .from(countryNotes)
      .where(
        and(
          inArray(countryNotes.countryCode, countryCodes),
          eq(countryNotes.locale, "en"),
        ),
      ),
    db
      .select({
        tripStopId: recommendations.tripStopId,
        recipientId: recommendations.recipientId,
        souvenirId: recommendations.souvenirId,
        status: recommendations.status,
      })
      .from(recommendations)
      .where(inArray(recommendations.tripStopId, stopIds)),
  ]);

  const decisions = new Map(
    saved.map((row) => [
      `${row.tripStopId}|${row.recipientId}|${row.souvenirId}`,
      row.status,
    ]),
  );

  const stops = trip.stops.map((stop) => {
    const local = catalogue.filter((item) => item.countryCode === stop.countryCode);
    // Places the catalogue does not cover fall back to ideas that fit anywhere.
    const usesGeneric = local.length === 0;
    const pool = usesGeneric
      ? catalogue.filter((item) => item.countryCode === ANYWHERE)
      : local;

    return {
      stop,
      usesGeneric,
      notes: notes.find((note) => note.countryCode === stop.countryCode) ?? null,
      people: people.map((recipient) => {
        const ranked = rankSouvenirs(pool, stop, recipient, {
          anyCountry: usesGeneric,
        });
        const decisionOf = (souvenirId: string) =>
          decisions.get(`${stop.id}|${recipient.id}|${souvenirId}`) ?? "suggested";
        const toItem = (scored: (typeof ranked)[number]): RecommendationItem => ({
          souvenirId: scored.souvenir.id,
          name: scored.souvenir.name,
          description: scored.souvenir.description,
          priceTier: scored.souvenir.priceTier,
          score: scored.score,
          reasons: scored.reasons.map(explain),
          outOfSeason: scored.outOfSeason,
        });

        return {
          recipient,
          bought: ranked
            .filter((item) => decisionOf(item.souvenir.id) === "bought")
            .map(toItem),
          suggested: pickVaried(
            ranked.filter((item) => decisionOf(item.souvenir.id) === "suggested"),
            SUGGESTIONS_PER_PERSON,
          ).map(toItem),
          dismissed: ranked
            .filter((item) => decisionOf(item.souvenir.id) === "dismissed")
            .map(toItem),
        };
      }),
    };
  });

  return { trip, people, stops };
}
