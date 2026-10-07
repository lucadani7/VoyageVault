import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tripStops } from "@/db/schema";
import { authenticate, notFound } from "@/lib/api";
import { getTrip } from "@/lib/trips";

type Context = { params: Promise<{ id: string; stopId: string }> };

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
