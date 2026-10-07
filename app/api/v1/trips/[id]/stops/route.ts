import { db } from "@/db";
import { tripStops } from "@/db/schema";
import { authenticate, invalid, notFound, ok, readJson } from "@/lib/api";
import { tripShape } from "@/lib/api-shapes";
import { getTrip } from "@/lib/trips";
import { validateStop } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

/** Add a stop to a trip. The place comes from GET /api/v1/places. */
export async function POST(request: Request, { params }: Context) {
  const { user, response } = await authenticate();
  if (!user) return response;
  const { body, response: bodyError } = await readJson(request);
  if (!body) return bodyError;

  const trip = await getTrip(user.id, (await params).id);
  if (!trip) return notFound("Trip");

  const stop = validateStop(body);
  if (!stop.ok) return invalid(stop.error);
  const { countryCode, place, visitStatus, arrivalDate, departureDate } = stop.value;

  await db.insert(tripStops).values({
    tripId: trip.id,
    countryCode,
    placeRef: place.ref,
    region: place.region,
    city: place.city,
    lat: place.lat,
    lng: place.lng,
    visitStatus,
    arrivalDate,
    departureDate,
    position: trip.stops.length,
  });

  const updated = await getTrip(user.id, trip.id);
  return ok({ trip: tripShape(updated!) }, 201);
}
