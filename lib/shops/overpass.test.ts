import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildQuery, distanceBetween, MAX_SHOPS, parseOverpass } from "./overpass";

const florence = { lat: 43.7696, lng: 11.2558 };

const response = {
  elements: [
    { type: "node", id: 1, lat: 43.7700, lon: 11.2560, tags: { shop: "gift", name: "Ricordi di Firenze", "addr:street": "Via Roma", "addr:housenumber": "5", website: "ricordi.example", opening_hours: "Mo-Sa 09:00-19:00" } },
    { type: "way", id: 2, center: { lat: 43.7800, lon: 11.2600 }, tags: { tourism: "museum", name: "Galleria degli Uffizi", website: "https://www.uffizi.it" } },
    { type: "node", id: 3, lat: 43.7710, lon: 11.2540, tags: { amenity: "marketplace", name: "Mercato Centrale" } },
    { type: "node", id: 4, lat: 43.7705, lon: 11.2565, tags: { shop: "chocolate", name: "Cioccolato <b>Bello</b>", website: "javascript:alert(1)" } },
    // Skipped: no name, not a souvenir place, no coordinates, mapped twice.
    { type: "node", id: 5, lat: 43.77, lon: 11.25, tags: { shop: "gift" } },
    { type: "node", id: 6, lat: 43.77, lon: 11.25, tags: { shop: "supermarket", name: "Coop" } },
    { type: "relation", id: 7, tags: { shop: "craft", name: "Bottega" } },
    { type: "way", id: 8, center: { lat: 43.77001, lon: 11.25601 }, tags: { shop: "souvenir", name: "ricordi di firenze" } },
  ],
};

describe("reading Overpass results", () => {
  const shops = parseOverpass(response, florence);

  it("keeps named souvenir places and sorts them nearest first", () => {
    assert.deepEqual(shops.map((shop) => shop.name), [
      "Ricordi di Firenze",
      "Cioccolato <b>Bello</b>",
      "Mercato Centrale",
      "Galleria degli Uffizi",
    ]);
    assert.ok(shops[0].distance < shops[1].distance);
  });

  it("classifies each place", () => {
    assert.deepEqual(shops.map((shop) => shop.kind), ["gift", "sweets", "market", "museum"]);
  });

  it("builds the address and takes coordinates from a way's centre", () => {
    assert.equal(shops[0].address, "Via Roma 5");
    assert.equal(shops[0].id, "node/1");
    assert.equal(shops[3].lat, 43.78);
  });

  it("only passes on real web addresses", () => {
    assert.equal(shops[0].website, "https://ricordi.example/");
    assert.equal(shops[3].website, "https://www.uffizi.it/");
    assert.equal(shops[1].website, null, "a javascript: link must not survive");
  });

  it("copes with malformed or empty answers", () => {
    assert.deepEqual(parseOverpass(null, florence), []);
    assert.deepEqual(parseOverpass({ elements: "nope" }, florence), []);
    assert.deepEqual(parseOverpass({}, florence), []);
  });

  it("caps the list in dense cities", () => {
    const many = {
      elements: Array.from({ length: 200 }, (_, i) => ({
        type: "node", id: i, lat: 43.77 + i * 0.0001, lon: 11.25, tags: { shop: "gift", name: `Shop ${i}` },
      })),
    };
    assert.equal(parseOverpass(many, florence).length, MAX_SHOPS);
  });
});

describe("helpers", () => {
  it("measures distance in metres", () => {
    const rome = { lat: 41.9028, lng: 12.4964 };
    const km = distanceBetween(florence, rome) / 1000;
    assert.ok(km > 225 && km < 240, `Florence-Rome should be about 232 km, got ${km}`);
    assert.equal(distanceBetween(florence, florence), 0);
  });

  it("asks only for named souvenir places within the radius", () => {
    const query = buildQuery(43.77, 11.25, 3000);
    assert.ok(query.includes("(around:3000,43.77,11.25)"));
    assert.ok(query.includes('"shop"~"^(gift|souvenir|craft|art|pottery|chocolate|confectionery|antiques)$"'));
    assert.ok(query.includes('"amenity"="marketplace"') && query.includes('"tourism"="museum"'));
  });
});
