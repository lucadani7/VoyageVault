import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allSouvenirs } from "../../db/seed/all";
import {
  monthsOfStay,
  pickVaried,
  rankSouvenirs,
  regionMatches,
  type ScorableRecipient,
  type ScorableSouvenir,
  type ScorableStop,
  scoreSouvenir,
} from "./score";

// The real catalogue, shaped the way the recommender receives it.
const catalogue: ScorableSouvenir[] = allSouvenirs.map((entry) => ({
  id: entry.slug,
  countryCode: entry.countryCode,
  region: entry.region ?? null,
  category: entry.category,
  priceTier: entry.priceTier,
  seasonMonths: entry.seasonMonths ?? [],
  ageGroups: entry.ageGroups,
  tags: entry.tags,
}));

const stop = (overrides: Partial<ScorableStop>): ScorableStop => ({
  countryCode: "FR",
  region: null,
  city: null,
  arrivalDate: "2026-06-10",
  departureDate: "2026-06-14",
  ...overrides,
});

const grandmother: ScorableRecipient = {
  relationship: "family",
  ageGroup: "senior",
  interests: ["home-decor", "collectibles"],
};
const friendsChild: ScorableRecipient = {
  relationship: "friend",
  ageGroup: "child",
  interests: ["science", "tech", "toys"],
};
const coworker: ScorableRecipient = {
  relationship: "coworker",
  ageGroup: "adult",
  interests: ["sweets"],
};

const ids = (ranked: { souvenir: { id: string } }[]) =>
  ranked.map((item) => item.souvenir.id);

describe("examples from the project brief", () => {
  const paris = stop({ region: "Ile-de-France", city: "Paris" });

  it("suggests the porcelain Eiffel Tower to the grandmother back from Paris", () => {
    const ranked = rankSouvenirs(catalogue, paris, grandmother);
    assert.equal(ranked[0].souvenir.id, "fr-eiffel-porcelain");
  });

  it("suggests the science kit to the best friend's child", () => {
    const ranked = rankSouvenirs(catalogue, paris, friendsChild);
    assert.equal(ranked[0].souvenir.id, "fr-science-kit");
  });

  it("suggests a mărțișor to those crossing Romania in February-March", () => {
    const romaniaInMarch = stop({
      countryCode: "RO",
      city: "Bucharest",
      arrivalDate: "2026-02-27",
      departureDate: "2026-03-02",
    });
    const ranked = rankSouvenirs(catalogue, romaniaInMarch, {
      relationship: "friend",
      ageGroup: "adult",
      interests: ["tradition"],
    });
    assert.equal(ranked[0].souvenir.id, "ro-martisor");
  });

  it("does not push the mărțișor in summer", () => {
    const romaniaInJuly = stop({
      countryCode: "RO",
      arrivalDate: "2026-07-10",
      departureDate: "2026-07-15",
    });
    const ranked = rankSouvenirs(catalogue, romaniaInJuly, coworker);
    const martisor = ranked.find((item) => item.souvenir.id === "ro-martisor");
    assert.ok(martisor?.outOfSeason);
    assert.notEqual(ranked[0].souvenir.id, "ro-martisor");
  });

  it("suggests a boomerang to those who passed through Australia", () => {
    const ranked = rankSouvenirs(catalogue, stop({ countryCode: "AU" }), {
      relationship: "friend",
      ageGroup: "teen",
      interests: ["sports", "tradition"],
    });
    assert.equal(ranked[0].souvenir.id, "au-boomerang");
  });
});

describe("rules", () => {
  it("only suggests souvenirs from the country of the stop", () => {
    const ranked = rankSouvenirs(catalogue, stop({ countryCode: "JP" }), coworker);
    assert.ok(ranked.length > 0);
    assert.ok(ranked.every((item) => item.souvenir.countryCode === "JP"));
  });

  it("never suggests an adults-only item to a child or a teenager", () => {
    for (const ageGroup of ["child", "teen"] as const) {
      for (const countryCode of ["FR", "MX", "JP", "GB", "KP", "CO"]) {
        const ranked = rankSouvenirs(catalogue, stop({ countryCode }), {
          relationship: "family",
          ageGroup,
          interests: ["drinks", "food"],
        });
        for (const item of ranked) {
          assert.ok(
            item.souvenir.ageGroups.includes(ageGroup),
            `${item.souvenir.id} offered to a ${ageGroup}`,
          );
        }
      }
    }
  });

  it("ranks an item higher the more interests it shares", () => {
    const base = { relationship: "friend", ageGroup: "adult" } as const;
    const tea = catalogue.find((item) => item.id === "gb-english-tea")!;
    const london = stop({ countryCode: "GB" });
    const none = scoreSouvenir(tea, london, { ...base, interests: ["sports"] })!;
    const one = scoreSouvenir(tea, london, { ...base, interests: ["drinks"] })!;
    const two = scoreSouvenir(tea, london, { ...base, interests: ["drinks", "tradition"] })!;
    assert.ok(none.score < one.score && one.score < two.score);
  });

  it("prefers regional souvenirs in their own region", () => {
    const glass = catalogue.find((item) => item.id === "it-murano-glass")!;
    const adult: ScorableRecipient = { relationship: "family", ageGroup: "adult", interests: [] };
    const inVenice = scoreSouvenir(glass, stop({ countryCode: "IT", region: "Veneto", city: "Venice" }), adult)!;
    const inSicily = scoreSouvenir(glass, stop({ countryCode: "IT", region: "Sicily", city: "Palermo" }), adult)!;
    assert.ok(inVenice.score > inSicily.score);
    assert.deepEqual(inVenice.reasons[0], { kind: "region", region: "Veneto" });
  });

  it("steers colleagues towards modest gifts and family towards special ones", () => {
    const whisky = catalogue.find((item) => item.id === "gb-whisky")!; // premium
    const scotland = stop({ countryCode: "GB", region: "Scotland" });
    const asFamily = scoreSouvenir(whisky, scotland, { relationship: "family", ageGroup: "adult", interests: [] })!;
    const asCoworker = scoreSouvenir(whisky, scotland, { relationship: "coworker", ageGroup: "adult", interests: [] })!;
    assert.ok(asFamily.score > asCoworker.score);
  });
});

describe("helpers", () => {
  it("matches regions regardless of accents, case and longer official names", () => {
    assert.ok(regionMatches("Provence", stop({ region: "Provence-Alpes-Côte d'Azur" })));
    assert.ok(regionMatches("Vâlcea", stop({ region: "Valcea" })));
    assert.ok(regionMatches("Paris", stop({ region: "Ile-de-France", city: "Paris" })));
    assert.ok(!regionMatches("Tuscany", stop({ region: "Lazio", city: "Rome" })));
  });

  it("lists the months of a stay, including across New Year", () => {
    assert.deepEqual(monthsOfStay("2026-03-05", "2026-03-09"), [3]);
    assert.deepEqual(monthsOfStay("2026-02-27", "2026-03-02"), [2, 3]);
    assert.deepEqual(monthsOfStay("2026-12-28", "2027-01-03"), [12, 1]);
  });

  it("keeps a short list varied", () => {
    const ranked = rankSouvenirs(catalogue, stop({ countryCode: "BE" }), coworker);
    const picked = pickVaried(ranked, 5);
    const foods = picked.filter((item) => item.souvenir.category === "food");
    assert.ok(picked.length > 0 && foods.length <= 2, ids(picked).join(", "));
  });
});
