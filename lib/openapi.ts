import { z } from "zod";
import { EXPORT_FORMATS } from "./export/recommendations";
import { SHOP_KINDS } from "./shops/overpass";
import {
  decisionSchema,
  recipientSchema,
  stopSchema,
  tripSchema,
} from "./validation";
import { VISIT_STATUSES } from "./visit-status";
import {
  AGE_GROUPS,
  INTEREST_TAGS,
  PRICE_TIERS,
  RECOMMENDATION_STATUSES,
  RELATIONSHIPS,
  SOUVENIR_CATEGORIES,
} from "./vocabulary";

/**
 * The OpenAPI 3.1 description of /api/v1, served at /api/v1/openapi.json.
 * Enumerations are taken from the same lists the app itself uses, so the
 * documentation cannot fall out of step with them. A test checks that every
 * path listed here has a route file, and the other way round.
 */

/**
 * A request body exactly as the app validates it: generated from the Zod
 * schema, so the documented rules are the enforced rules.
 */
function input(schema: z.ZodType) {
  const { $schema: _dialect, ...jsonSchema } = z.toJSONSchema(schema, {
    io: "input",
  });
  return jsonSchema;
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ "application/json": { schema } });
const uuid = { type: "string", format: "uuid" };
const date = { type: "string", format: "date", example: "2026-06-10" };
const nullable = (schema: object) => ({ anyOf: [schema, { type: "null" }] });

const errors = {
  "400": { description: "The request is not valid.", content: json(ref("Error")) },
  "401": { description: "Not signed in.", content: json(ref("Error")) },
  "404": { description: "Not found, or not yours.", content: json(ref("Error")) },
};
const idParam = (name: string, description: string) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: uuid,
});
const body = (schema: object) => ({ required: true, content: json(schema) });
const okJson = (description: string, schema: object) => ({
  description,
  content: json(schema),
});
const wrap = (key: string, schema: object) => ({
  type: "object",
  required: [key],
  properties: { [key]: schema },
});

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "VoyageVault API",
    version: "1.0.0",
    description:
      "Trips, the people you bring souvenirs home for, and souvenir recommendations for every stop.\n\n" +
      "**Authentication.** The API uses the same session cookie as the website: sign in at `/sign-in` in this browser, then call the API from it. Requests with a body must be sent as `application/json`.\n\n" +
      "**Errors** always have the shape `{ \"error\": { \"code\", \"message\" } }`.",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    { name: "Trips" },
    { name: "People" },
    { name: "Recommendations" },
    { name: "Catalogue" },
  ],
  paths: {
    "/trips": {
      get: {
        tags: ["Trips"],
        summary: "List your trips",
        responses: {
          "200": okJson("Trips, newest first.", wrap("trips", { type: "array", items: ref("TripSummary") })),
          "401": errors["401"],
        },
      },
      post: {
        tags: ["Trips"],
        summary: "Create a trip",
        requestBody: body(ref("TripInput")),
        responses: {
          "201": okJson("The new trip.", wrap("trip", ref("Trip"))),
          "400": errors["400"],
          "401": errors["401"],
        },
      },
    },
    "/trips/{id}": {
      parameters: [idParam("id", "Trip id")],
      get: {
        tags: ["Trips"],
        summary: "Get a trip with its stops",
        responses: { "200": okJson("The trip.", wrap("trip", ref("Trip"))), "401": errors["401"], "404": errors["404"] },
      },
      patch: {
        tags: ["Trips"],
        summary: "Rename a trip",
        requestBody: body(ref("TripInput")),
        responses: { "200": okJson("The renamed trip.", wrap("trip", ref("Trip"))), ...errors },
      },
      delete: {
        tags: ["Trips"],
        summary: "Delete a trip and its stops",
        responses: { "204": { description: "Deleted." }, "401": errors["401"], "404": errors["404"] },
      },
    },
    "/trips/{id}/stops": {
      parameters: [idParam("id", "Trip id")],
      post: {
        tags: ["Trips"],
        summary: "Add a stop",
        description: "`place` must be one of the results of `GET /places`.",
        requestBody: body(ref("StopInput")),
        responses: { "201": okJson("The trip with the new stop.", wrap("trip", ref("Trip"))), ...errors },
      },
    },
    "/trips/{id}/stops/{stopId}": {
      parameters: [idParam("id", "Trip id"), idParam("stopId", "Stop id")],
      put: {
        tags: ["Trips"],
        summary: "Change a stop",
        description: "Replaces the whole stop; `place` must be one of the results of `GET /places`.",
        requestBody: body(ref("StopInput")),
        responses: { "200": okJson("The trip with the changed stop.", wrap("trip", ref("Trip"))), ...errors },
      },
      delete: {
        tags: ["Trips"],
        summary: "Remove a stop",
        responses: { "204": { description: "Removed." }, "401": errors["401"], "404": errors["404"] },
      },
    },
    "/trips/{id}/stops/{stopId}/shops": {
      parameters: [idParam("id", "Trip id"), idParam("stopId", "Stop id")],
      get: {
        tags: ["Recommendations"],
        summary: "Places near a stop where souvenirs can be bought",
        description:
          "Gift and craft shops, markets, sweet shops, antique dealers and museums from OpenStreetMap, nearest first. " +
          "Looks within 3 km of a city and 15 km of a region; results are cached for a week. " +
          "`located` is false for older stops saved without coordinates.",
        responses: {
          "200": okJson("Up to 60 places.", {
            type: "object",
            required: ["shops", "located"],
            properties: { shops: { type: "array", items: ref("Shop") }, located: { type: "boolean" } },
          }),
          "401": errors["401"],
          "404": errors["404"],
          "502": { description: "The map data service is unavailable.", content: json(ref("Error")) },
        },
      },
    },
    "/places": {
      get: {
        tags: ["Trips"],
        summary: "Search cities and regions of a country",
        parameters: [
          { name: "country", in: "query", required: true, schema: { type: "string", example: "IT" }, description: "ISO 3166-1 alpha-2 code" },
          { name: "q", in: "query", required: true, schema: { type: "string", minLength: 2, example: "flor" }, description: "At least two characters" },
        ],
        responses: {
          "200": okJson("Up to eight matches.", wrap("places", { type: "array", items: ref("Place") })),
          "401": errors["401"],
          "502": { description: "The place search service is unavailable.", content: json(ref("Error")) },
        },
      },
    },
    "/places/country": {
      get: {
        tags: ["Trips"],
        summary: "Where to centre a map for a country",
        parameters: [
          { name: "code", in: "query", required: true, schema: { type: "string", example: "FR" }, description: "ISO 3166-1 alpha-2 code" },
        ],
        responses: {
          "200": okJson("The centre and, for compact countries, the bounds.", wrap("view", ref("CountryView"))),
          "401": errors["401"],
          "404": errors["404"],
          "502": { description: "The place search service is unavailable.", content: json(ref("Error")) },
        },
      },
    },
    "/recipients": {
      get: {
        tags: ["People"],
        summary: "List the people you buy souvenirs for",
        responses: { "200": okJson("People, by name.", wrap("recipients", { type: "array", items: ref("Recipient") })), "401": errors["401"] },
      },
      post: {
        tags: ["People"],
        summary: "Add a person",
        requestBody: body(ref("RecipientInput")),
        responses: { "201": okJson("The new person.", wrap("recipient", ref("Recipient"))), "400": errors["400"], "401": errors["401"] },
      },
    },
    "/recipients/{id}": {
      parameters: [idParam("id", "Person id")],
      get: {
        tags: ["People"],
        summary: "Get a person",
        responses: { "200": okJson("The person.", wrap("recipient", ref("Recipient"))), "401": errors["401"], "404": errors["404"] },
      },
      put: {
        tags: ["People"],
        summary: "Replace a person's profile",
        requestBody: body(ref("RecipientInput")),
        responses: { "200": okJson("The updated person.", wrap("recipient", ref("Recipient"))), ...errors },
      },
      delete: {
        tags: ["People"],
        summary: "Delete a person",
        responses: { "204": { description: "Deleted." }, "401": errors["401"], "404": errors["404"] },
      },
    },
    "/trips/{id}/recommendations": {
      parameters: [idParam("id", "Trip id")],
      get: {
        tags: ["Recommendations"],
        summary: "Recommended souvenirs for a trip, in four formats",
        description:
          "For every stop and every person: what was bought and the best current suggestions. " +
          "Choose the format with `?format=` or with the `Accept` header; JSON is the default.",
        parameters: [
          { name: "format", in: "query", schema: { type: "string", enum: EXPORT_FORMATS }, description: "Overrides the Accept header" },
          { name: "download", in: "query", schema: { type: "string", enum: ["1"] }, description: "Makes the browser save the response as a file" },
        ],
        responses: {
          "200": {
            description: "The recommendation list.",
            content: {
              "application/json": { schema: ref("RecommendationList") },
              "text/csv": { schema: { type: "string", description: "One row per souvenir; UTF-8 with BOM." } },
              "application/xml": { schema: { type: "string" } },
              "text/html": { schema: { type: "string", description: "A printable page." } },
            },
          },
          ...errors,
        },
      },
      put: {
        tags: ["Recommendations"],
        summary: "Mark a suggestion as bought or dismissed",
        description: "`suggested` clears an earlier decision.",
        requestBody: body(ref("Decision")),
        responses: { "200": okJson("The stored decision.", wrap("decision", ref("Decision"))), ...errors },
      },
    },
    "/catalogue/countries": {
      get: {
        tags: ["Catalogue"],
        summary: "Countries covered by the catalogue",
        responses: {
          "200": okJson("Countries, by name.", wrap("countries", { type: "array", items: { type: "object", required: ["code", "name"], properties: { code: { type: "string" }, name: { type: "string" } } } })),
          "401": errors["401"],
        },
      },
    },
    "/catalogue/countries/{code}": {
      parameters: [{ name: "code", in: "path", required: true, schema: { type: "string", example: "KP" }, description: "ISO 3166-1 alpha-2 code" }],
      get: {
        tags: ["Catalogue"],
        summary: "A country's notes and souvenirs",
        responses: {
          "200": okJson("Known for, good to know, and every souvenir.", {
            type: "object",
            required: ["country", "souvenirs"],
            properties: {
              country: {
                type: "object",
                required: ["code", "name", "knownFor", "goodToKnow"],
                properties: { code: { type: "string" }, name: { type: "string" }, knownFor: { type: "string" }, goodToKnow: { type: "string" } },
              },
              souvenirs: { type: "array", items: ref("Souvenir") },
            },
          }),
          "401": errors["401"],
          "404": errors["404"],
        },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: { code: { type: "string", example: "invalid_request" }, message: { type: "string" } },
          },
        },
      },
      TripInput: input(tripSchema),
      StopInput: input(stopSchema),
      RecipientInput: input(recipientSchema),
      Decision: input(decisionSchema),
      CountryView: {
        type: "object",
        required: ["center", "bounds"],
        properties: {
          center: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2, description: "[lat, lng]" },
          bounds: nullable({
            type: "array",
            description: "[[south, west], [north, east]]; null when the country is too spread out to frame",
            items: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
          }),
        },
      },
      Shop: {
        type: "object",
        required: ["id", "name", "kind", "lat", "lng", "distance"],
        properties: {
          id: { type: "string", example: "node/123", description: "OpenStreetMap reference" },
          name: { type: "string" },
          kind: { type: "string", enum: SHOP_KINDS },
          lat: { type: "number" },
          lng: { type: "number" },
          distance: { type: "integer", description: "Metres from the centre of the stop" },
          address: nullable({ type: "string" }),
          website: nullable({ type: "string", format: "uri" }),
          openingHours: nullable({ type: "string", description: "In OpenStreetMap's opening_hours syntax" }),
        },
      },
      TripSummary: {
        type: "object",
        required: ["id", "name", "stopCount"],
        properties: { id: uuid, name: { type: "string" }, stopCount: { type: "integer" }, firstDate: nullable(date), lastDate: nullable(date) },
      },
      Trip: {
        type: "object",
        required: ["id", "name", "createdAt", "stops"],
        properties: { id: uuid, name: { type: "string" }, createdAt: { type: "string", format: "date-time" }, stops: { type: "array", items: ref("Stop") } },
      },
      Place: {
        type: "object",
        required: ["ref", "kind", "lat", "lng"],
        properties: {
          ref: { type: "string", example: "R42602", description: "OpenStreetMap reference" },
          kind: { type: "string", enum: ["city", "region"] },
          city: nullable({ type: "string" }),
          region: nullable({ type: "string" }),
          lat: { type: "number" },
          lng: { type: "number" },
          label: { type: "string", example: "Florence, Tuscany" },
        },
      },
      Stop: {
        type: "object",
        required: ["id", "countryCode", "country", "arrivalDate", "departureDate"],
        properties: {
          id: uuid,
          countryCode: { type: "string" },
          country: { type: "string" },
          region: nullable({ type: "string" }),
          city: nullable({ type: "string" }),
          placeRef: nullable({ type: "string" }),
          lat: nullable({ type: "number" }),
          lng: nullable({ type: "number" }),
          visitStatus: nullable({ type: "string", enum: VISIT_STATUSES }),
          arrivalDate: date,
          departureDate: date,
        },
      },
      Recipient: {
        allOf: [ref("RecipientInput"), { type: "object", required: ["id"], properties: { id: uuid } }],
      },
      Souvenir: {
        type: "object",
        required: ["id", "name", "description", "category", "priceTier", "ageGroups", "tags"],
        properties: {
          id: uuid,
          name: { type: "string" },
          description: { type: "string" },
          region: nullable({ type: "string" }),
          category: { type: "string", enum: SOUVENIR_CATEGORIES },
          priceTier: { type: "string", enum: PRICE_TIERS },
          seasonMonths: { type: "array", items: { type: "integer", minimum: 1, maximum: 12 }, description: "Empty means all year" },
          ageGroups: { type: "array", items: { type: "string", enum: AGE_GROUPS } },
          tags: { type: "array", items: { type: "string", enum: INTEREST_TAGS } },
        },
      },
      RecommendationList: {
        type: "object",
        required: ["trip", "generatedAt", "stops"],
        properties: {
          trip: { type: "object", required: ["id", "name"], properties: { id: uuid, name: { type: "string" } } },
          generatedAt: { type: "string", format: "date-time" },
          stops: {
            type: "array",
            items: {
              type: "object",
              properties: {
                position: { type: "integer" },
                countryCode: { type: "string" },
                country: { type: "string" },
                region: nullable({ type: "string" }),
                city: nullable({ type: "string" }),
                arrivalDate: date,
                departureDate: date,
                visitStatus: nullable({ type: "string", enum: VISIT_STATUSES }),
                knownFor: nullable({ type: "string" }),
                goodToKnow: nullable({ type: "string" }),
                people: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: uuid,
                      name: { type: "string" },
                      relationship: { type: "string", enum: RELATIONSHIPS },
                      ageGroup: { type: "string", enum: AGE_GROUPS },
                      recommendations: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            souvenirId: uuid,
                            name: { type: "string" },
                            description: { type: "string" },
                            category: { type: "string", enum: SOUVENIR_CATEGORIES },
                            priceTier: { type: "string", enum: PRICE_TIERS },
                            status: { type: "string", enum: ["bought", "suggested"] },
                            score: { type: "integer" },
                            reasons: { type: "array", items: { type: "string" } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
