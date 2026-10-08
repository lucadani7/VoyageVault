"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { tripStops, trips } from "@/db/schema";
import type { Place } from "@/lib/places";
import { requireUser } from "@/lib/session";
import { getTrip, isUuid } from "@/lib/trips";
import {
  placeSchema,
  validateStop,
  validateTrip,
} from "@/lib/validation";
import { VISIT_STATUSES, type VisitStatus } from "@/lib/visit-status";

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

export type TripFormState = { error: string | null; name: string };

export async function createTrip(
  _previous: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const user = await requireUser();
  const input = validateTrip({ name: formData.get("name") });
  if (!input.ok) return { error: input.error, name: text(formData, "name") };

  const [trip] = await db
    .insert(trips)
    .values({ userId: user.id, name: input.value.name })
    .returning({ id: trips.id });

  redirect(`/trips/${trip.id}`);
}

export async function renameTrip(
  formData: FormData,
): Promise<{ error: string | null }> {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const input = validateTrip({ name: formData.get("name") });
  if (!input.ok) return { error: input.error };

  const trip = await getTrip(user.id, tripId);
  if (!trip) return { error: "This trip no longer exists." };

  await db
    .update(trips)
    .set({ name: input.value.name })
    .where(and(eq(trips.id, trip.id), eq(trips.userId, user.id)));

  revalidatePath(`/trips/${trip.id}`);
  revalidatePath("/trips");
  return { error: null };
}

export async function deleteTrip(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  if (!isUuid(tripId)) return;

  await db
    .delete(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, user.id)));

  revalidatePath("/trips");
  redirect("/trips");
}

export async function deleteAllTrips() {
  const user = await requireUser();

  // Scoped to the signed-in user; stops go with their trips (cascade).
  await db.delete(trips).where(eq(trips.userId, user.id));

  revalidatePath("/trips");
  redirect("/trips");
}

export type StopFormValues = {
  countryCode: string;
  /** The city or region picked from the suggestions, if any. */
  place: Place | null;
  /** Empty until the user picks one; never preselected. */
  visitStatus: VisitStatus | "";
  arrivalDate: string;
  departureDate: string;
};

export type StopFormState = {
  error: string | null;
  /** Bumped on every submission so the form can reset its fields. */
  version: number;
  values: StopFormValues;
};

/**
 * Collects the chosen place from the form's hidden inputs, in the shape the
 * place schema expects. Null when no place was picked at all.
 */
function rawPlace(formData: FormData) {
  if (!text(formData, "placeRef")) return null;
  return {
    ref: text(formData, "placeRef"),
    kind: text(formData, "placeKind"),
    city: text(formData, "city"),
    region: text(formData, "region"),
    lat: Number(text(formData, "lat")),
    lng: Number(text(formData, "lng")),
  };
}

/**
 * Adds a stop, or updates one when the form carries its id. A new stop
 * leaves a fresh form behind; an edited one returns to the trip.
 */
export async function saveStop(
  previous: StopFormState,
  formData: FormData,
): Promise<StopFormState> {
  const user = await requireUser();
  const version = previous.version + 1;
  const tripId = text(formData, "tripId");
  const stopId = text(formData, "stopId");
  const raw = {
    countryCode: text(formData, "countryCode"),
    place: rawPlace(formData),
    visitStatus: text(formData, "visitStatus"),
    arrivalDate: text(formData, "arrivalDate"),
    departureDate: text(formData, "departureDate"),
  };

  // What to put back in the form if the stop is rejected.
  const chosenPlace = placeSchema.safeParse(raw.place);
  const values: StopFormValues = {
    countryCode: raw.countryCode,
    place: chosenPlace.success ? chosenPlace.data : null,
    visitStatus:
      VISIT_STATUSES.find((status) => status === raw.visitStatus) ?? "",
    arrivalDate: raw.arrivalDate,
    departureDate: raw.departureDate,
  };
  const fail = (error: string): StopFormState => ({ error, version, values });

  const trip = await getTrip(user.id, tripId);
  if (!trip) return fail("This trip no longer exists.");
  const existing = stopId ? trip.stops.find((stop) => stop.id === stopId) : null;
  if (stopId && !existing) return fail("This stop no longer exists.");

  const input = validateStop(raw);
  if (!input.ok) {
    // Nothing typed at all reads better as a prompt than as a correction.
    const nothingTyped = input.field === "place" && !text(formData, "placeQuery");
    return fail(nothingTyped ? "Add the city or region you visited." : input.error);
  }
  const { countryCode, place, visitStatus, arrivalDate, departureDate } = input.value;

  const data = {
    countryCode,
    placeRef: place.ref,
    region: place.region,
    city: place.city,
    lat: place.lat,
    lng: place.lng,
    visitStatus,
    arrivalDate,
    departureDate,
  };

  if (existing) {
    await db
      .update(tripStops)
      .set(data)
      .where(and(eq(tripStops.id, existing.id), eq(tripStops.tripId, trip.id)));
    revalidatePath(`/trips/${trip.id}`);
    redirect(`/trips/${trip.id}`);
  }

  await db.insert(tripStops).values({ ...data, tripId: trip.id });
  revalidatePath(`/trips/${trip.id}`);
  // Start the next stop where this one ended: stops usually follow on.
  return {
    error: null,
    version,
    values: {
      countryCode: "",
      place: null,
      visitStatus: "",
      arrivalDate: departureDate,
      departureDate: "",
    },
  };
}

export async function deleteStop(formData: FormData) {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const stopId = text(formData, "stopId");
  if (!isUuid(stopId)) return;

  const trip = await getTrip(user.id, tripId);
  if (!trip) return;

  await db
    .delete(tripStops)
    .where(and(eq(tripStops.id, stopId), eq(tripStops.tripId, trip.id)));

  revalidatePath(`/trips/${trip.id}`);
}
