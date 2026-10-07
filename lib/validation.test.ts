import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  validateDecision,
  validateRecipient,
  validateStop,
  validateTrip,
} from "./validation";

const place = { ref: "R42602", kind: "city", city: "Florence", region: "Tuscany", lat: 43.77, lng: 11.25 };
const stop = { countryCode: "it", place, visitStatus: "visited", arrivalDate: "2025-09-05", departureDate: "2025-09-09" };
const person = { name: " Grandma Maria ", relationship: "family", ageGroup: "senior", interests: ["sweets", "home-decor", "sweets"] };
const uuid = "494f0fed-e84a-4fcd-80b2-9da173be01a8";

const errorOf = (result: { ok: boolean; error?: string }) => (result.ok ? null : result.error);

describe("trips", () => {
  it("trims the name and rejects empty or over-long ones", () => {
    assert.deepEqual(validateTrip({ name: "  Autumn in Italy " }), { ok: true, value: { name: "Autumn in Italy" } });
    assert.equal(errorOf(validateTrip({ name: "   " })), "Give the trip a name.");
    assert.equal(errorOf(validateTrip({})), "Give the trip a name.");
    assert.equal(errorOf(validateTrip({ name: null })), "Give the trip a name.");
    assert.equal(errorOf(validateTrip({ name: "x".repeat(101) })), "Keep the name under 100 characters.");
  });
});

describe("stops", () => {
  it("accepts a complete stop and normalises it", () => {
    const result = validateStop(stop);
    assert.ok(result.ok);
    assert.equal(result.value.countryCode, "IT");
    assert.equal(result.value.place.label, "Florence, Tuscany");
  });

  it("reports problems in the order of the form", () => {
    assert.equal(errorOf(validateStop({})), "Choose a country.");
    assert.equal(errorOf(validateStop({ ...stop, countryCode: "XX" })), "Choose a country.");
    assert.equal(errorOf(validateStop({ ...stop, place: null })), "Choose the city or region from the suggestions.");
    assert.equal(errorOf(validateStop({ ...stop, visitStatus: "" })), "Choose whether you already visited, are visiting or plan to visit this place.");
    assert.equal(errorOf(validateStop({ ...stop, arrivalDate: "" })), "Select the arrival and departure dates.");
  });

  it("never accepts free text or a tampered place", () => {
    const message = "Choose the city or region from the suggestions.";
    assert.equal(errorOf(validateStop({ ...stop, place: "Florence" })), message);
    assert.equal(errorOf(validateStop({ ...stop, place: { ...place, ref: "Florence" } })), message);
    assert.equal(errorOf(validateStop({ ...stop, place: { ...place, lat: 123 } })), message);
    assert.equal(errorOf(validateStop({ ...stop, place: { ...place, lat: "43.77" } })), message);
    assert.equal(errorOf(validateStop({ ...stop, place: { ...place, city: "", region: null } })), message);
    const failed = validateStop({ ...stop, place: null });
    assert.ok(!failed.ok && failed.field === "place");
  });

  it("allows a region without a city", () => {
    const result = validateStop({ ...stop, place: { ...place, kind: "region", city: null, region: "Calabria" } });
    assert.ok(result.ok && result.value.place.city === null && result.value.place.label === "Calabria");
  });

  it("checks that the dates are real and in order", () => {
    assert.equal(errorOf(validateStop({ ...stop, arrivalDate: "2025-02-30" })), "Select the arrival and departure dates.");
    assert.equal(errorOf(validateStop({ ...stop, arrivalDate: "05/09/2025" })), "Select the arrival and departure dates.");
    assert.equal(errorOf(validateStop({ ...stop, departureDate: "2025-09-04" })), "The departure date cannot be before the arrival date.");
    assert.ok(validateStop({ ...stop, departureDate: stop.arrivalDate }).ok, "same-day stays are fine");
  });
});

describe("people", () => {
  it("accepts a profile, trimming text and de-duplicating interests", () => {
    const result = validateRecipient(person);
    assert.ok(result.ok);
    assert.equal(result.value.name, "Grandma Maria");
    assert.deepEqual(result.value.interests, ["sweets", "home-decor"]);
    assert.equal(result.value.notes, null);
  });

  it("requires every choice to be made explicitly", () => {
    assert.equal(errorOf(validateRecipient({ ...person, name: "" })), "Enter the person's name.");
    assert.equal(errorOf(validateRecipient({ ...person, relationship: "" })), "Choose how this person is related to you.");
    assert.equal(errorOf(validateRecipient({ ...person, ageGroup: null })), "Choose an age group.");
    assert.equal(errorOf(validateRecipient({ ...person, interests: [] })), "Choose at least one interest, so the suggestions can fit.");
    assert.equal(errorOf(validateRecipient({ ...person, interests: undefined })), "Choose at least one interest, so the suggestions can fit.");
  });

  it("rejects unknown interests and over-long notes", () => {
    assert.match(errorOf(validateRecipient({ ...person, interests: ["sweets", "astrology"] })) ?? "", /^An interest must be one of: food, sweets/);
    assert.equal(errorOf(validateRecipient({ ...person, notes: "x".repeat(501) })), "Keep the notes under 500 characters.");
    const withNotes = validateRecipient({ ...person, notes: "  Collects magnets " });
    assert.ok(withNotes.ok && withNotes.value.notes === "Collects magnets");
  });
});

describe("decisions", () => {
  it("accepts ids and a known status", () => {
    assert.ok(validateDecision({ stopId: uuid, recipientId: uuid, souvenirId: uuid, status: "bought" }).ok);
  });

  it("names the field that is wrong", () => {
    assert.equal(errorOf(validateDecision({ stopId: "1", recipientId: uuid, souvenirId: uuid, status: "bought" })), "stopId must be a UUID.");
    assert.equal(errorOf(validateDecision({ stopId: uuid, recipientId: uuid, souvenirId: uuid, status: "lost" })), "status must be one of: suggested, bought, dismissed.");
  });
});
