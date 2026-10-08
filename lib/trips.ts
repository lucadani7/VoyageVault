import { and, asc, count, desc, eq, max, min, sql } from "drizzle-orm";
import { db } from "@/db";
import { tripStops, trips } from "@/db/schema";
import { isUuid } from "./validation";

export { isUuid };

/** A user's trips, newest first, with a summary of their stops. */
export async function getTrips(userId: string) {
  return db
    .select({
      id: trips.id,
      name: trips.name,
      stopCount: count(tripStops.id),
      firstDate: min(tripStops.arrivalDate),
      lastDate: max(tripStops.departureDate),
      // Every stop in travel order, so the list can show the full place
      // (city, region, country) exactly as the user entered it.
      stops: sql<
        { city: string | null; region: string | null; countryCode: string }[]
      >`coalesce(
        json_agg(
          json_build_object(
            'city', ${tripStops.city},
            'region', ${tripStops.region},
            'countryCode', ${tripStops.countryCode}
          )
          order by ${tripStops.arrivalDate}, ${tripStops.createdAt}
        ) filter (where ${tripStops.id} is not null),
        '[]'
      )`,
    })
    .from(trips)
    .leftJoin(tripStops, eq(tripStops.tripId, trips.id))
    .where(eq(trips.userId, userId))
    .groupBy(trips.id)
    .orderBy(desc(trips.createdAt));
}

/**
 * One trip with its stops in travel order, or null when it does not exist
 * or belongs to someone else. Every read and write of a trip goes through
 * this ownership check.
 */
export async function getTrip(userId: string, tripId: string) {
  if (!isUuid(tripId)) return null;

  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)));
  if (!trip) return null;

  const stops = await db
    .select()
    .from(tripStops)
    .where(eq(tripStops.tripId, tripId))
    .orderBy(asc(tripStops.arrivalDate), asc(tripStops.createdAt));

  return { ...trip, stops };
}
