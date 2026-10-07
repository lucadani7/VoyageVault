import { countryName } from "./countries";
import type { getRecipient } from "./recipients";
import type { getTrip } from "./trips";

/** How trips, stops and people look in API responses. */

type TripWithStops = NonNullable<Awaited<ReturnType<typeof getTrip>>>;
type Recipient = NonNullable<Awaited<ReturnType<typeof getRecipient>>>;

export function stopShape(stop: TripWithStops["stops"][number]) {
  return {
    id: stop.id,
    countryCode: stop.countryCode,
    country: countryName(stop.countryCode),
    region: stop.region,
    city: stop.city,
    placeRef: stop.placeRef,
    lat: stop.lat,
    lng: stop.lng,
    visitStatus: stop.visitStatus,
    arrivalDate: stop.arrivalDate,
    departureDate: stop.departureDate,
  };
}

export function tripShape(trip: TripWithStops) {
  return {
    id: trip.id,
    name: trip.name,
    createdAt: trip.createdAt.toISOString(),
    stops: trip.stops.map(stopShape),
  };
}

export function recipientShape(recipient: Recipient) {
  return {
    id: recipient.id,
    name: recipient.name,
    relationship: recipient.relationship,
    ageGroup: recipient.ageGroup,
    interests: recipient.interests,
    notes: recipient.notes,
  };
}
