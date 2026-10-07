import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shopSearches } from "@/db/schema";
import {
  buildQuery,
  CITY_RADIUS,
  parseOverpass,
  REGION_RADIUS,
  type Shop,
} from "./overpass";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "VoyageVault (https://github.com/lucadani7/VoyageVault)";

/** Shops change slowly; a week keeps the load on the free service low. */
const CACHE_DAYS = 7;

export class ShopSearchUnavailable extends Error {}

/**
 * Places selling souvenirs around a stop, nearest first. Answers are kept
 * in the database for a week, so each area is asked of Overpass only once
 * no matter how many people or page loads need it.
 */
export async function getShopsNear(stop: {
  lat: number;
  lng: number;
  city: string | null;
}): Promise<Shop[]> {
  const radius = stop.city ? CITY_RADIUS : REGION_RADIUS;
  // About 100 m of precision: nearby stops share one cached answer.
  const key = `${stop.lat.toFixed(3)},${stop.lng.toFixed(3)},${radius}`;

  const [cached] = await db
    .select()
    .from(shopSearches)
    .where(eq(shopSearches.key, key));
  const fresh =
    cached &&
    Date.now() - cached.fetchedAt.getTime() < CACHE_DAYS * 24 * 60 * 60 * 1000;
  if (fresh) return cached.shops;

  let shops: Shop[];
  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: new URLSearchParams({ data: buildQuery(stop.lat, stop.lng, radius) }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) throw new Error(`Overpass responded ${response.status}`);
    shops = parseOverpass(await response.json(), stop);
  } catch (error) {
    // An old answer is better than none while the service is down.
    if (cached) return cached.shops;
    throw new ShopSearchUnavailable("Shop search is unavailable right now.", {
      cause: error,
    });
  }

  await db
    .insert(shopSearches)
    .values({ key, shops })
    .onConflictDoUpdate({
      target: shopSearches.key,
      set: { shops, fetchedAt: new Date() },
    });
  return shops;
}

export type { Shop } from "./overpass";
