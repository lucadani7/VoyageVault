import { isCountryCode } from "./countries";
import type { Place } from "./places";
import { VISIT_STATUSES, type VisitStatus } from "./visit-status";
import {
  AGE_GROUPS,
  type AgeGroup,
  INTEREST_TAGS,
  type InterestTag,
  RECOMMENDATION_STATUSES,
  type RecommendationStatus,
  RELATIONSHIPS,
  type Relationship,
} from "./vocabulary";

/**
 * The rules for data coming in through the API. Each function takes raw,
 * untrusted input and returns either the cleaned value or a message that
 * can be shown to the caller as it is.
 */

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const good = <T>(value: T): Result<T> => ({ ok: true, value });
const bad = (error: string): Result<never> => ({ ok: false, error });

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const oneOf = <T extends string>(options: readonly T[], value: unknown) =>
  options.find((option) => option === value);

const isIsoDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateTripName(raw: unknown): Result<string> {
  const name = str(raw);
  if (!name) return bad("name is required.");
  if (name.length > 100) return bad("name must be at most 100 characters.");
  return good(name);
}

export type StopInput = {
  countryCode: string;
  place: Place;
  visitStatus: VisitStatus;
  arrivalDate: string;
  departureDate: string;
};

export function validatePlace(raw: unknown): Result<Place> {
  if (typeof raw !== "object" || raw === null) {
    return bad("place is required: pick one from GET /api/v1/places.");
  }
  const input = raw as Record<string, unknown>;
  const ref = str(input.ref);
  const kind = oneOf(["city", "region"] as const, input.kind);
  const city = str(input.city);
  const region = str(input.region);
  const { lat, lng } = input;

  if (!/^[NWR]\d{1,15}$/.test(ref)) return bad("place.ref is not valid.");
  if (!kind) return bad('place.kind must be "city" or "region".');
  if (!city && !region) return bad("place needs a city or a region.");
  if (city.length > 100 || region.length > 100) {
    return bad("place.city and place.region must be at most 100 characters.");
  }
  if (typeof lat !== "number" || !Number.isFinite(lat) || Math.abs(lat) > 90) {
    return bad("place.lat must be a number between -90 and 90.");
  }
  if (typeof lng !== "number" || !Number.isFinite(lng) || Math.abs(lng) > 180) {
    return bad("place.lng must be a number between -180 and 180.");
  }

  return good({
    ref,
    kind,
    city: city || null,
    region: region || null,
    lat,
    lng,
    label: [city, region].filter(Boolean).join(", "),
  });
}

export function validateStop(raw: Record<string, unknown>): Result<StopInput> {
  const countryCode = str(raw.countryCode).toUpperCase();
  if (!isCountryCode(countryCode)) {
    return bad("countryCode must be an ISO 3166-1 alpha-2 code.");
  }

  const place = validatePlace(raw.place);
  if (!place.ok) return place;

  const visitStatus = oneOf(VISIT_STATUSES, raw.visitStatus);
  if (!visitStatus) {
    return bad(`visitStatus must be one of: ${VISIT_STATUSES.join(", ")}.`);
  }

  const arrivalDate = str(raw.arrivalDate);
  const departureDate = str(raw.departureDate);
  if (!isIsoDate(arrivalDate) || !isIsoDate(departureDate)) {
    return bad("arrivalDate and departureDate must be dates as YYYY-MM-DD.");
  }
  if (departureDate < arrivalDate) {
    return bad("departureDate cannot be before arrivalDate.");
  }

  return good({ countryCode, place: place.value, visitStatus, arrivalDate, departureDate });
}

export type RecipientInput = {
  name: string;
  relationship: Relationship;
  ageGroup: AgeGroup;
  interests: InterestTag[];
  notes: string | null;
};

export function validateRecipient(raw: Record<string, unknown>): Result<RecipientInput> {
  const name = str(raw.name);
  if (!name) return bad("name is required.");
  if (name.length > 100) return bad("name must be at most 100 characters.");

  const relationship = oneOf(RELATIONSHIPS, raw.relationship);
  if (!relationship) {
    return bad(`relationship must be one of: ${RELATIONSHIPS.join(", ")}.`);
  }

  const ageGroup = oneOf(AGE_GROUPS, raw.ageGroup);
  if (!ageGroup) return bad(`ageGroup must be one of: ${AGE_GROUPS.join(", ")}.`);

  if (!Array.isArray(raw.interests)) return bad("interests must be a list.");
  const unknown = raw.interests.find((tag) => !oneOf(INTEREST_TAGS, tag));
  if (unknown !== undefined) {
    return bad(`Unknown interest "${String(unknown)}". Allowed: ${INTEREST_TAGS.join(", ")}.`);
  }
  // De-duplicated and in the catalogue's own order.
  const interests = INTEREST_TAGS.filter((tag) => (raw.interests as unknown[]).includes(tag));
  if (interests.length === 0) return bad("interests needs at least one entry.");

  const notes = raw.notes === undefined || raw.notes === null ? "" : str(raw.notes);
  if (notes.length > 500) return bad("notes must be at most 500 characters.");

  return good({ name, relationship, ageGroup, interests, notes: notes || null });
}

export type DecisionInput = {
  stopId: string;
  recipientId: string;
  souvenirId: string;
  status: RecommendationStatus;
};

export function validateDecision(raw: Record<string, unknown>): Result<DecisionInput> {
  const stopId = str(raw.stopId);
  const recipientId = str(raw.recipientId);
  const souvenirId = str(raw.souvenirId);
  for (const [field, value] of Object.entries({ stopId, recipientId, souvenirId })) {
    if (!UUID.test(value)) return bad(`${field} must be a UUID.`);
  }
  const status = oneOf(RECOMMENDATION_STATUSES, raw.status);
  if (!status) {
    return bad(`status must be one of: ${RECOMMENDATION_STATUSES.join(", ")}.`);
  }
  return good({ stopId, recipientId, souvenirId, status });
}
