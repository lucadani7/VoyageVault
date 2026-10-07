import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
// Relative path on purpose: drizzle-kit reads this file without the "@/" alias.
import type { Shop } from "@/lib/shops/overpass";
import { VISIT_STATUSES } from "@/lib/visit-status";
import {
  AGE_GROUPS,
  INTEREST_TAGS,
  type InterestTag,
  PRICE_TIERS,
  RECOMMENDATION_STATUSES,
  RELATIONSHIPS,
  SOUVENIR_CATEGORIES,
} from "@/lib/vocabulary";

/* ------------------------------------------------------------------ */
/* Shared vocabularies live in lib/vocabulary.ts; re-exported here      */
/* ------------------------------------------------------------------ */

export {
  AGE_GROUPS,
  INTEREST_TAGS,
  PRICE_TIERS,
  RECOMMENDATION_STATUSES,
  RELATIONSHIPS,
  SOUVENIR_CATEGORIES,
};
export type {
  AgeGroup,
  InterestTag,
  PriceTier,
  RecommendationStatus,
  Relationship,
  SouvenirCategory,
} from "../lib/vocabulary";

export const relationshipEnum = pgEnum("relationship", RELATIONSHIPS);
export const ageGroupEnum = pgEnum("age_group", AGE_GROUPS);
export const souvenirCategoryEnum = pgEnum(
  "souvenir_category",
  SOUVENIR_CATEGORIES,
);
export const priceTierEnum = pgEnum("price_tier", PRICE_TIERS);
export const visitStatusEnum = pgEnum("visit_status", VISIT_STATUSES);
export const recommendationStatusEnum = pgEnum(
  "recommendation_status",
  RECOMMENDATION_STATUSES,
);

const createdAt = timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());

/* ------------------------------------------------------------------ */
/* Auth tables — shapes required by Better Auth                        */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt,
  updatedAt,
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt,
    updatedAt,
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

/**
 * One row per sign-in method of a user: a Google link, or the hashed
 * password for email sign-in (provider "credential").
 */
export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt,
    updatedAt,
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

/** Short-lived tokens for email verification and password reset. */
export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/* ------------------------------------------------------------------ */
/* Trips and their stops                                               */
/* ------------------------------------------------------------------ */

export const trips = pgTable(
  "trips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    startDate: date("start_date"),
    endDate: date("end_date"),
    createdAt,
    updatedAt,
  },
  (t) => [index("trips_user_id_idx").on(t.userId)],
);

export const tripStops = pgTable(
  "trip_stops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    /** ISO 3166-1 alpha-2, upper case (RO, FR, AU). */
    countryCode: text("country_code").notNull(),
    /** OpenStreetMap reference of the chosen city or region, e.g. "R42602". */
    placeRef: text("place_ref"),
    region: text("region"),
    city: text("city"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    /** Chosen by the user; null only on stops created before it existed. */
    visitStatus: visitStatusEnum("visit_status"),
    arrivalDate: date("arrival_date").notNull(),
    departureDate: date("departure_date").notNull(),
    /** Order of the stop within the trip, starting at 0. */
    position: integer("position").notNull().default(0),
    createdAt,
  },
  (t) => [index("trip_stops_trip_id_idx").on(t.tripId)],
);

/* ------------------------------------------------------------------ */
/* Recipients — the people souvenirs are bought for                    */
/* ------------------------------------------------------------------ */

export const recipients = pgTable(
  "recipients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    relationship: relationshipEnum("relationship").notNull(),
    ageGroup: ageGroupEnum("age_group").notNull(),
    interests: text("interests")
      .array()
      .$type<InterestTag[]>()
      .notNull()
      .default(sql`'{}'::text[]`),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (t) => [index("recipients_user_id_idx").on(t.userId)],
);

/* ------------------------------------------------------------------ */
/* Souvenir catalogue                                                  */
/* ------------------------------------------------------------------ */

export const souvenirs = pgTable(
  "souvenirs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Stable human-readable key, used to make seeding repeatable. */
    slug: text("slug").notNull().unique(),
    countryCode: text("country_code").notNull(),
    /** Set only when the souvenir is specific to one region or city. */
    region: text("region"),
    category: souvenirCategoryEnum("category").notNull(),
    priceTier: priceTierEnum("price_tier").notNull(),
    /** Months (1-12) when it is especially fitting. Empty = all year. */
    seasonMonths: smallint("season_months")
      .array()
      .notNull()
      .default(sql`'{}'::smallint[]`),
    ageGroups: ageGroupEnum("age_groups").array().notNull(),
    tags: text("tags")
      .array()
      .$type<InterestTag[]>()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdAt,
  },
  (t) => [index("souvenirs_country_code_idx").on(t.countryCode)],
);

/**
 * Display text lives here, one row per language, so adding a language never
 * needs a schema change. Every souvenir must have an `en` row.
 */
export const souvenirTranslations = pgTable(
  "souvenir_translations",
  {
    souvenirId: uuid("souvenir_id")
      .notNull()
      .references(() => souvenirs.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
  },
  (t) => [primaryKey({ columns: [t.souvenirId, t.locale] })],
);

/**
 * Cache of shop searches around a point, so the free OpenStreetMap service
 * is asked about each area only once in a while.
 */
export const shopSearches = pgTable("shop_searches", {
  /** "lat,lng,radius", with coordinates rounded to about 100 m. */
  key: text("key").primaryKey(),
  shops: jsonb("shops").$type<Shop[]>().notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Two lines of context per country and language: what it is known for, and
 * one practical thing worth knowing before travelling or shopping there.
 */
export const countryNotes = pgTable(
  "country_notes",
  {
    countryCode: text("country_code").notNull(),
    locale: text("locale").notNull(),
    knownFor: text("known_for").notNull(),
    goodToKnow: text("good_to_know").notNull(),
  },
  (t) => [primaryKey({ columns: [t.countryCode, t.locale] })],
);

/* ------------------------------------------------------------------ */
/* Recommendations — a souvenir suggested for a recipient at a stop    */
/* ------------------------------------------------------------------ */

export const recommendations = pgTable(
  "recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripStopId: uuid("trip_stop_id")
      .notNull()
      .references(() => tripStops.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => recipients.id, { onDelete: "cascade" }),
    souvenirId: uuid("souvenir_id")
      .notNull()
      .references(() => souvenirs.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    status: recommendationStatusEnum("status").notNull().default("suggested"),
    createdAt,
    updatedAt,
  },
  (t) => [
    unique("recommendations_stop_recipient_souvenir_key").on(
      t.tripStopId,
      t.recipientId,
      t.souvenirId,
    ),
    index("recommendations_recipient_id_idx").on(t.recipientId),
  ],
);

export type User = typeof users.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;
export type TripStop = typeof tripStops.$inferSelect;
export type NewTripStop = typeof tripStops.$inferInsert;
export type Recipient = typeof recipients.$inferSelect;
export type NewRecipient = typeof recipients.$inferInsert;
export type Souvenir = typeof souvenirs.$inferSelect;
export type SouvenirTranslation = typeof souvenirTranslations.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
