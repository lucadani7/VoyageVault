"use server";

import { revalidatePath } from "next/cache";
import { saveDecision } from "@/lib/recommendations";
import { requireUser } from "@/lib/session";
import { validateDecision } from "@/lib/validation";

/** Form action behind the Bought / Not for them / Restore buttons. */
export async function setRecommendationStatus(formData: FormData) {
  const user = await requireUser();
  const tripId = String(formData.get("tripId") ?? "");

  const decision = validateDecision({
    stopId: formData.get("stopId"),
    recipientId: formData.get("recipientId"),
    souvenirId: formData.get("souvenirId"),
    status: formData.get("status"),
  });
  if (!decision.ok) return;

  if (await saveDecision(user.id, tripId, decision.value)) {
    revalidatePath(`/trips/${tripId}/recommendations`);
  }
}
