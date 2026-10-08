import { z } from "zod";
import { isCountryCode } from "./countries";
import type { Place } from "./places";
import { VISIT_STATUSES } from "./visit-status";
import {
  AGE_GROUPS,
  INTEREST_TAGS,
  RECOMMENDATION_STATUSES,
  RELATIONSHIPS,
} from "./vocabulary";

/**
 * The one place where the rules for incoming data are written down. The
 * forms, the REST API and the API documentation all use these schemas, so
 * a rule changed here changes everywhere at once.
 *
 * Messages are written for the person filling in the form; the API returns
 * the same sentences.
 */

const requiredText = (max: number, missing: string, tooLong: string) =>
  z.string({ error: missing }).trim().min(1, missing).max(max, tooLong);

/** Optional text: missing, null and blank all become null. */
const optionalText = (max: number, tooLong: string) =>
  z
    .string()
    .trim()
    .max(max, tooLong)
    .nullish()
    .transform((value) => value || null);

/* ------------------------------- Trips ------------------------------ */

export const tripSchema = z.object({
  name: requiredText(
    100,
    "Give the trip a name.",
    "Keep the name under 100 characters.",
  ),
});

/* ------------------------------- Stops ------------------------------ */

const PLACE_MESSAGE = "Choose the city or region from the suggestions.";
const DATES_MESSAGE = "Select the arrival and departure dates.";

/** A city or region exactly as returned by the place search. */
export const placeSchema = z
  .object(
    {
      ref: z.string().regex(/^[NWR]\d{1,15}$/),
      kind: z.enum(["city", "region"]),
      city: optionalText(100, PLACE_MESSAGE),
      region: optionalText(100, PLACE_MESSAGE),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    },
    { error: PLACE_MESSAGE },
  )
  .refine((place) => place.city || place.region, { error: PLACE_MESSAGE })
  .transform(
    (place): Place => ({
      ...place,
      label: [place.city, place.region].filter(Boolean).join(", "),
    }),
  );

export const stopSchema = z
  .object({
    countryCode: z
      .string({ error: "Choose a country." })
      .trim()
      .toUpperCase()
      .refine(isCountryCode, { error: "Choose a country." }),
    place: placeSchema,
    visitStatus: z.enum(VISIT_STATUSES, {
      error:
        "Choose whether you already visited, are visiting or plan to visit this place.",
    }),
    arrivalDate: z.iso.date({ error: DATES_MESSAGE }),
    departureDate: z.iso.date({ error: DATES_MESSAGE }),
  })
  .refine((stop) => stop.departureDate >= stop.arrivalDate, {
    error: "The departure date cannot be before the arrival date.",
    path: ["departureDate"],
  });

/* ------------------------------ People ------------------------------ */

const INTERESTS_MESSAGE = "Choose at least one interest, so the suggestions can fit.";

export const recipientSchema = z.object({
  name: requiredText(
    100,
    "Enter the person's name.",
    "Keep the name under 100 characters.",
  ),
  relationship: z.enum(RELATIONSHIPS, {
    error: "Choose how this person is related to you.",
  }),
  ageGroup: z.enum(AGE_GROUPS, { error: "Choose an age group." }),
  interests: z
    .array(
      z.enum(INTEREST_TAGS, {
        error: `An interest must be one of: ${INTEREST_TAGS.join(", ")}.`,
      }),
      { error: INTERESTS_MESSAGE },
    )
    .min(1, INTERESTS_MESSAGE)
    // De-duplicated and in the catalogue's own order.
    .transform((chosen) => INTEREST_TAGS.filter((tag) => chosen.includes(tag))),
  notes: optionalText(500, "Keep the notes under 500 characters."),
});

/* --------------------------- Recommendations ------------------------- */

const id = (field: string) => z.guid({ error: `${field} must be a UUID.` });

export const decisionSchema = z.object({
  stopId: id("stopId"),
  recipientId: id("recipientId"),
  souvenirId: id("souvenirId"),
  status: z.enum(RECOMMENDATION_STATUSES, {
    error: `status must be one of: ${RECOMMENDATION_STATUSES.join(", ")}.`,
  }),
});

/** True for a well-formed id; checked before any id reaches the database. */
export const isUuid = (value: unknown) => z.guid().safeParse(value).success;

/* ------------------------------ Results ----------------------------- */

export type TripInput = z.output<typeof tripSchema>;
export type StopInput = z.output<typeof stopSchema>;
export type RecipientInput = z.output<typeof recipientSchema>;
export type DecisionInput = z.output<typeof decisionSchema>;

export type Result<T> =
  | { ok: true; value: T }
  /** `field` is the top-level field the first problem belongs to. */
  | { ok: false; error: string; field: string | null };

/**
 * Checks raw, untrusted input against a schema and reports only the first
 * problem, in the order the fields appear on the form.
 */
export function validate<S extends z.ZodType>(
  schema: S,
  raw: unknown,
): Result<z.output<S>> {
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, value: parsed.data };

  const [issue] = parsed.error.issues;
  const field = issue.path.length > 0 ? String(issue.path[0]) : null;
  // Anything wrong inside `place` means the same thing to the user.
  const error = field === "place" ? PLACE_MESSAGE : issue.message;
  return { ok: false, error, field };
}

export const validateTrip = (raw: unknown) => validate(tripSchema, raw);
export const validateStop = (raw: unknown) => validate(stopSchema, raw);
export const validateRecipient = (raw: unknown) => validate(recipientSchema, raw);
export const validateDecision = (raw: unknown) => validate(decisionSchema, raw);
