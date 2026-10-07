import { db } from "@/db";
import { trips } from "@/db/schema";
import { authenticate, invalid, ok, readJson } from "@/lib/api";
import { tripShape } from "@/lib/api-shapes";
import { getTrip, getTrips } from "@/lib/trips";
import { validateTripName } from "@/lib/validation";

/** List the signed-in user's trips, newest first. */
export async function GET() {
  const { user, response } = await authenticate();
  if (!user) return response;

  const summaries = await getTrips(user.id);
  return ok({
    trips: summaries.map((trip) => ({
      id: trip.id,
      name: trip.name,
      stopCount: trip.stopCount,
      firstDate: trip.firstDate,
      lastDate: trip.lastDate,
    })),
  });
}

/** Create a trip. */
export async function POST(request: Request) {
  const { user, response } = await authenticate();
  if (!user) return response;
  const { body, response: bodyError } = await readJson(request);
  if (!body) return bodyError;

  const name = validateTripName(body.name);
  if (!name.ok) return invalid(name.error);

  const [created] = await db
    .insert(trips)
    .values({ userId: user.id, name: name.value })
    .returning({ id: trips.id });

  const trip = await getTrip(user.id, created.id);
  return ok({ trip: tripShape(trip!) }, 201);
}
