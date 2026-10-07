import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { trips } from "@/db/schema";
import { authenticate, invalid, notFound, ok, readJson } from "@/lib/api";
import { tripShape } from "@/lib/api-shapes";
import { getTrip } from "@/lib/trips";
import { validateTrip } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

/** One trip with its stops in travel order. */
export async function GET(_request: Request, { params }: Context) {
  const { user, response } = await authenticate();
  if (!user) return response;

  const trip = await getTrip(user.id, (await params).id);
  return trip ? ok({ trip: tripShape(trip) }) : notFound("Trip");
}

/** Rename a trip. */
export async function PATCH(request: Request, { params }: Context) {
  const { user, response } = await authenticate();
  if (!user) return response;
  const { body, response: bodyError } = await readJson(request);
  if (!body) return bodyError;

  const trip = await getTrip(user.id, (await params).id);
  if (!trip) return notFound("Trip");

  const input = validateTrip(body);
  if (!input.ok) return invalid(input.error);
  const { name } = input.value;

  await db
    .update(trips)
    .set({ name })
    .where(and(eq(trips.id, trip.id), eq(trips.userId, user.id)));

  return ok({ trip: tripShape({ ...trip, name }) });
}

/** Delete a trip and its stops. */
export async function DELETE(_request: Request, { params }: Context) {
  const { user, response } = await authenticate();
  if (!user) return response;

  const trip = await getTrip(user.id, (await params).id);
  if (!trip) return notFound("Trip");

  await db
    .delete(trips)
    .where(and(eq(trips.id, trip.id), eq(trips.userId, user.id)));
  return new Response(null, { status: 204 });
}
