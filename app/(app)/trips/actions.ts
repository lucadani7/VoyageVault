"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { tripStops, trips } from "@/db/schema";
import { isCountryCode } from "@/lib/countries";
import type { Place } from "@/lib/places";
import { requireUser } from "@/lib/session";
import { getTrip, isUuid } from "@/lib/trips";
import { VISIT_STATUSES, type VisitStatus } from "@/lib/visit-status";

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

const isIsoDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export type TripFormState = { error: string | null; name: string };

export async function createTrip(
  _previous: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const user = await requireUser();
  const name = text(formData, "name");

  if (!name) return { error: "Give your trip a name.", name };
  if (name.length > 100) {
    return { error: "Keep the name under 100 characters.", name };
  }

  const [trip] = await db
    .insert(trips)
    .values({ userId: user.id, name })
    .returning({ id: trips.id });

  redirect(`/trips/${trip.id}`);
}

export async function renameTrip(
  formData: FormData,
): Promise<{ error: string | null }> {
  const user = await requireUser();
  const tripId = text(formData, "tripId");
  const name = text(formData, "name");

  if (!name) return { error: "Give your trip a name." };
  if (name.length > 100) {
    return { error: "Keep the name under 100 characters." };
  }

  const trip = await getTrip(user.id, tripId);
  if (!trip) return { error: "This trip no longer exists." };

  await db
    .update(trips)
    .set({ name })
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
 * Rebuilds the chosen place from the form's hidden inputs. Returns null when
 * nothing was chosen, or when the values are not what the picker produces.
 */
function readPlace(formData: FormData): Place | null {
  const ref = text(formData, "placeRef");
  const kind = text(formData, "placeKind");
  const city = text(formData, "city");
  const region = text(formData, "region");
  const label = text(formData, "placeLabel");
  const lat = Number(text(formData, "lat"));
  const lng = Number(text(formData, "lng"));

  const valid =
    /^[NWR]\d{1,15}$/.test(ref) &&
    (kind === "city" || kind === "region") &&
    Boolean(city || region) &&
    [city, region, label].every((value) => value.length <= 100) &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    Number.isFinite(lng) &&
    Math.abs(lng) <= 180;
  if (!valid) return null;

  return {
    ref,
    kind,
    city: city || null,
    region: region || null,
    lat,
    lng,
    label: label || city || region,
  };
}

export async function addStop(
  previous: StopFormState,
  formData: FormData,
): Promise<StopFormState> {
  const user = await requireUser();
  const version = previous.version + 1;
  const tripId = text(formData, "tripId");
  const place = readPlace(formData);
  const visitStatus = VISIT_STATUSES.find(
    (status) => status === text(formData, "visitStatus"),
  );
  const values: StopFormValues = {
    countryCode: text(formData, "countryCode"),
    place,
    visitStatus: visitStatus ?? "",
    arrivalDate: text(formData, "arrivalDate"),
    departureDate: text(formData, "departureDate"),
  };
  const fail = (error: string): StopFormState => ({ error, version, values });

  const trip = await getTrip(user.id, tripId);
  if (!trip) return fail("This trip no longer exists.");

  if (!isCountryCode(values.countryCode)) return fail("Choose a country.");
  // A stop always names a place, and only one picked from the suggestions
  // counts: typed text that was never chosen is not a place.
  if (!place) {
    return fail(
      text(formData, "placeQuery")
        ? "Choose the city or region from the suggestions."
        : "Add the city or region you visited.",
    );
  }
  if (!visitStatus) {
    return fail(
      "Choose whether you already visited, are visiting or plan to visit this place.",
    );
  }
  if (!isIsoDate(values.arrivalDate) || !isIsoDate(values.departureDate)) {
    return fail("Select your arrival and departure dates.");
  }
  if (values.departureDate < values.arrivalDate) {
    return fail("The departure date cannot be before the arrival date.");
  }

  await db.insert(tripStops).values({
    tripId: trip.id,
    countryCode: values.countryCode,
    placeRef: place.ref,
    region: place.region,
    city: place.city,
    lat: place.lat,
    lng: place.lng,
    visitStatus,
    arrivalDate: values.arrivalDate,
    departureDate: values.departureDate,
    position: trip.stops.length,
  });

  revalidatePath(`/trips/${trip.id}`);
  // Start the next stop where this one ended: stops usually follow on.
  return {
    error: null,
    version,
    values: {
      countryCode: "",
      place: null,
      visitStatus: "",
      arrivalDate: values.departureDate,
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
