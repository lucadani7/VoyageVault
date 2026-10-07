"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { recommendations, souvenirs } from "@/db/schema";
import { getRecipient } from "@/lib/recipients";
import { scoreSouvenir } from "@/lib/recommender/score";
import { requireUser } from "@/lib/session";
import { getTrip, isUuid } from "@/lib/trips";
import { RECOMMENDATION_STATUSES } from "@/lib/vocabulary";

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

/**
 * Records what the user decided about one suggestion: bought, dismissed, or
 * back to merely suggested (which simply forgets the decision).
 */
export async function setRecommendationStatus(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const stopId = text(formData, "stopId");
  const recipientId = text(formData, "recipientId");
  const souvenirId = text(formData, "souvenirId");
  const status = RECOMMENDATION_STATUSES.find(
    (value) => value === text(formData, "status"),
  );
  if (!status || !isUuid(souvenirId)) return;

  // Both the trip (with this stop) and the person must belong to the user.
  const trip = await getTrip(user.id, tripId);
  const stop = trip?.stops.find((item) => item.id === stopId);
  const recipient = await getRecipient(user.id, recipientId);
  if (!trip || !stop || !recipient) return;

  const key = and(
    eq(recommendations.tripStopId, stop.id),
    eq(recommendations.recipientId, recipient.id),
    eq(recommendations.souvenirId, souvenirId),
  );

  if (status === "suggested") {
    await db.delete(recommendations).where(key);
  } else {
    const [souvenir] = await db
      .select()
      .from(souvenirs)
      .where(eq(souvenirs.id, souvenirId));
    if (!souvenir) return;

    const score =
      scoreSouvenir(souvenir, stop, recipient, { anyCountry: true })?.score ?? 0;

    await db
      .insert(recommendations)
      .values({
        tripStopId: stop.id,
        recipientId: recipient.id,
        souvenirId,
        score,
        status,
      })
      .onConflictDoUpdate({
        target: [
          recommendations.tripStopId,
          recommendations.recipientId,
          recommendations.souvenirId,
        ],
        set: { status, score },
      });
  }

  revalidatePath(`/trips/${trip.id}/recommendations`);
}
