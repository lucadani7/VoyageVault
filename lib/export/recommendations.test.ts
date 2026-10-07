import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildExport,
  csvCell,
  type ExportDocument,
  pickFormat,
  toCsv,
  toHtml,
  toJson,
  toXml,
} from "./recommendations";

const item = (overrides: object = {}) => ({
  souvenirId: "s1",
  name: "Porcelain Eiffel Tower figurine",
  description: 'A delicate ornament, "made in France" & fragile.',
  category: "decor" as const,
  priceTier: "mid" as const,
  score: 75,
  reasons: ["Typical of Paris", "Matches interests: Home decor"],
  outOfSeason: false,
  ...overrides,
});

const document: ExportDocument = buildExport(
  {
    trip: { id: "t1", name: "Paris <2026> & beyond" },
    stops: [
      {
        stop: {
          countryCode: "FR",
          region: "Ile-de-France",
          city: "Paris",
          arrivalDate: "2026-06-10",
          departureDate: "2026-06-14",
          visitStatus: "visited",
        },
        notes: { knownFor: "Food and wine.", goodToKnow: "VAT refunds exist." },
        people: [
          {
            recipient: { id: "r1", name: "Grandma, Maria", relationship: "family", ageGroup: "senior" },
            bought: [item()],
            suggested: [item({ souvenirId: "s2", name: "Macarons", reasons: [] })],
          },
          {
            recipient: { id: "r2", name: "=cmd()", relationship: "friend", ageGroup: "child" },
            bought: [],
            suggested: [item({ souvenirId: "s3", name: "<script>alert(1)</script>" })],
          },
        ],
      },
    ],
  },
  new Date("2026-10-08T00:00:00Z"),
);

describe("building the export", () => {
  it("lists bought items first, then suggestions, with their status", () => {
    const [first, second] = document.stops[0].people[0].recommendations;
    assert.deepEqual([first.status, second.status], ["bought", "suggested"]);
    assert.equal(document.stops[0].country, "France");
    assert.equal(document.generatedAt, "2026-10-08T00:00:00.000Z");
  });
});

describe("JSON", () => {
  it("round-trips through JSON.parse", () => {
    assert.deepEqual(JSON.parse(toJson(document)), document);
  });
});

describe("CSV", () => {
  const csv = toCsv(document);
  const lines = csv.replace(/^﻿/, "").trimEnd().split("\r\n");

  it("has a header and one row per souvenir", () => {
    assert.ok(csv.startsWith("﻿"), "starts with a BOM for Excel");
    assert.equal(lines.length, 1 + 3);
    assert.ok(lines[0].startsWith("stop,country,region,city"));
  });

  it("quotes commas and doubles quotes", () => {
    assert.ok(lines[1].includes('"Grandma, Maria"'));
    assert.ok(lines[1].includes('"A delicate ornament, ""made in France"" & fragile."'));
  });

  it("defuses spreadsheet formulas in user-entered text", () => {
    assert.equal(csvCell("=cmd()"), "'=cmd()");
    assert.equal(csvCell("+1"), "'+1");
    assert.equal(csvCell("@x"), "'@x");
    assert.ok(lines[3].includes("'=cmd()"));
  });

  it("leaves numbers and plain text alone", () => {
    assert.equal(csvCell(-5), "-5");
    assert.equal(csvCell("Paris"), "Paris");
    assert.equal(csvCell(null), "");
  });
});

describe("XML", () => {
  const xml = toXml(document);

  it("escapes markup in attributes and text", () => {
    assert.ok(xml.includes('trip="Paris &lt;2026&gt; &amp; beyond"'));
    assert.ok(xml.includes("<name>&lt;script&gt;alert(1)&lt;/script&gt;</name>"));
    assert.ok(xml.includes("&quot;made in France&quot; &amp; fragile."));
    assert.ok(!xml.includes("<script>"));
  });

  it("is well formed: every opened element is closed", () => {
    const stack: string[] = [];
    for (const [, closing, name, selfClosing] of xml.matchAll(/<(\/?)([a-zA-Z]+)[^>]*?(\/?)>/g)) {
      if (selfClosing) continue;
      if (closing) assert.equal(stack.pop(), name);
      else stack.push(name);
    }
    assert.deepEqual(stack, []);
    assert.equal(xml.match(/<souvenir /g)?.length, 3);
  });
});

describe("HTML", () => {
  const html = toHtml(document);

  it("escapes anything that could be read as markup", () => {
    assert.ok(!html.includes("<script>alert(1)</script>"));
    assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
    assert.ok(html.includes("<title>Paris &lt;2026&gt; &amp; beyond"));
  });

  it("marks bought items", () => {
    assert.ok(html.includes('<li class="bought">'));
    assert.ok(html.includes("1. Paris, Ile-de-France, France"));
  });
});

describe("choosing the format", () => {
  it("lets ?format= win over the Accept header", () => {
    assert.equal(pickFormat("csv", "application/json"), "csv");
    assert.equal(pickFormat("XML", null), "xml");
    assert.equal(pickFormat("pdf", null), null);
  });

  it("falls back to the Accept header, then to JSON", () => {
    assert.equal(pickFormat(null, "text/csv"), "csv");
    assert.equal(pickFormat(null, "application/xml"), "xml");
    assert.equal(pickFormat(null, "text/html,application/xhtml+xml"), "html");
    assert.equal(pickFormat(null, "application/json, text/html"), "json");
    assert.equal(pickFormat(null, "*/*"), "json");
    assert.equal(pickFormat(null, null), "json");
  });
});
