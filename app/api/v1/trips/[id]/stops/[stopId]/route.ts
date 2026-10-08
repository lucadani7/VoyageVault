import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tripStops } from "@/db/schema";
import { authenticate, invalid, notFound, ok, readJson } from "@/lib/api";
import { tripShape } from "@/lib/api-shapes";
import { getTrip } from "@/lib/trips";
import { validateStop } from "@/lib/validation";

type Context = { params: Promise<{ id: string; stopId: string }> };

/** Replace a stop: its country, place, status and dates. */
export async function PUT(request: Request, { params }: Context) {
  const { user, response } = await authenticate();
  if (!user) return response;
  const { body, response: bodyError } = await readJson(request);
  if (!body) return bodyError;

  const { id, stopId } = await params;
  const trip = await getTrip(user.id, id);
  const stop = trip?.stops.find((item) => item.id === stopId);
  if (!trip || !stop) return notFound("Stop");

  const input = validateStop(body);
  if (!input.ok) return invalid(input.error);
  const { countryCode, place, visitStatus, arrivalDate, departureDate } = input.value;

  await db
    .update(tripStops)
    .set({
      countryCode,
      placeRef: place.ref,
      region: place.region,
      city: place.city,
      lat: place.lat,
      lng: place.lng,
      visitStatus,
      arrivalDate,
      departureDate,
    })
    .where(and(eq(tripStops.id, stop.id), eq(tripStops.tripId, trip.id)));

  const updated = await getTrip(user.id, trip.id);
  return ok({ trip: tripShape(updated!) });
}

/** Remove one stop from a trip. */
export async function DELETE(_request: Request, { params }: Context) {
  const { user, response } = await authenticate();
  if (!user) return response;

  const { id, stopId } = await params;
  const trip = await getTrip(user.id, id);
  const stop = trip?.stops.find((item) => item.id === stopId);
  if (!trip || !stop) return notFound("Stop");

  await db
    .delete(tripStops)
    .where(and(eq(tripStops.id, stop.id), eq(tripStops.tripId, trip.id)));
  return new Response(null, { status: 204 });
}
