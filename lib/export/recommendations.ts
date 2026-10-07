import { countryName } from "../countries";
import type { RecommendationItem } from "../recommendations";
import type { VisitStatus } from "../visit-status";
import type {
  AgeGroup,
  PriceTier,
  Relationship,
  SouvenirCategory,
} from "../vocabulary";

/**
 * The recommendation list of a trip in one neutral shape, and its four
 * renderings: JSON, CSV, XML and a printable HTML page. Everything here is
 * a pure function, so each format can be tested without a server.
 */

export type ExportedSouvenir = {
  souvenirId: string;
  name: string;
  description: string;
  category: SouvenirCategory;
  priceTier: PriceTier;
  status: "bought" | "suggested";
  score: number;
  reasons: string[];
};

export type ExportDocument = {
  trip: { id: string; name: string };
  generatedAt: string;
  stops: {
    position: number;
    countryCode: string;
    country: string;
    region: string | null;
    city: string | null;
    arrivalDate: string;
    departureDate: string;
    visitStatus: VisitStatus | null;
    knownFor: string | null;
    goodToKnow: string | null;
    people: {
      id: string;
      name: string;
      relationship: Relationship;
      ageGroup: AgeGroup;
      recommendations: ExportedSouvenir[];
    }[];
  }[];
};

/** The parts of the recommendations page data that an export needs. */
type Source = {
  trip: { id: string; name: string };
  stops: {
    stop: {
      countryCode: string;
      region: string | null;
      city: string | null;
      arrivalDate: string;
      departureDate: string;
      visitStatus: VisitStatus | null;
    };
    notes: { knownFor: string; goodToKnow: string } | null;
    people: {
      recipient: {
        id: string;
        name: string;
        relationship: Relationship;
        ageGroup: AgeGroup;
      };
      bought: RecommendationItem[];
      suggested: RecommendationItem[];
    }[];
  }[];
};

export function buildExport(source: Source, generatedAt: Date): ExportDocument {
  const toSouvenir =
    (status: ExportedSouvenir["status"]) =>
    (item: RecommendationItem): ExportedSouvenir => ({
      souvenirId: item.souvenirId,
      name: item.name,
      description: item.description,
      category: item.category,
      priceTier: item.priceTier,
      status,
      score: item.score,
      reasons: item.reasons,
    });

  return {
    trip: { id: source.trip.id, name: source.trip.name },
    generatedAt: generatedAt.toISOString(),
    stops: source.stops.map(({ stop, notes, people }, index) => ({
      position: index + 1,
      countryCode: stop.countryCode,
      country: countryName(stop.countryCode),
      region: stop.region,
      city: stop.city,
      arrivalDate: stop.arrivalDate,
      departureDate: stop.departureDate,
      visitStatus: stop.visitStatus,
      knownFor: notes?.knownFor ?? null,
      goodToKnow: notes?.goodToKnow ?? null,
      people: people.map(({ recipient, bought, suggested }) => ({
        id: recipient.id,
        name: recipient.name,
        relationship: recipient.relationship,
        ageGroup: recipient.ageGroup,
        recommendations: [
          ...bought.map(toSouvenir("bought")),
          ...suggested.map(toSouvenir("suggested")),
        ],
      })),
    })),
  };
}

/* ------------------------------- JSON ------------------------------- */

export function toJson(document: ExportDocument): string {
  return JSON.stringify(document, null, 2);
}

/* -------------------------------- CSV ------------------------------- */

const CSV_COLUMNS = [
  "stop",
  "country",
  "region",
  "city",
  "arrival",
  "departure",
  "visit_status",
  "recipient",
  "relationship",
  "age_group",
  "souvenir",
  "description",
  "category",
  "price",
  "status",
  "score",
  "reasons",
] as const;

/**
 * One CSV cell. Quotes anything containing a comma, quote or line break,
 * and defuses values that a spreadsheet would run as a formula: a person
 * named "=HYPERLINK(...)" must arrive as text.
 */
export function csvCell(value: string | number | null): string {
  if (value === null) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** One row per recommended souvenir. Starts with a BOM so Excel reads UTF-8. */
export function toCsv(document: ExportDocument): string {
  const rows: (string | number | null)[][] = [[...CSV_COLUMNS]];
  for (const stop of document.stops) {
    for (const person of stop.people) {
      for (const item of person.recommendations) {
        rows.push([
          stop.position,
          stop.country,
          stop.region,
          stop.city,
          stop.arrivalDate,
          stop.departureDate,
          stop.visitStatus,
          person.name,
          person.relationship,
          person.ageGroup,
          item.name,
          item.description,
          item.category,
          item.priceTier,
          item.status,
          item.score,
          item.reasons.join("; "),
        ]);
      }
    }
  }
  return `﻿${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

/* -------------------------------- XML ------------------------------- */

export function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    // Control characters are not allowed in XML 1.0 at all.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

const attributes = (values: Record<string, string | number | null>) =>
  Object.entries(values)
    .filter(([, value]) => value !== null)
    .map(([name, value]) => ` ${name}="${escapeXml(String(value))}"`)
    .join("");

const element = (name: string, text: string | null, indent: string) =>
  text === null ? "" : `${indent}<${name}>${escapeXml(text)}</${name}>\n`;

export function toXml(document: ExportDocument): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<recommendations${attributes({
    tripId: document.trip.id,
    trip: document.trip.name,
    generatedAt: document.generatedAt,
  })}>\n`;

  for (const stop of document.stops) {
    xml += `  <stop${attributes({
      position: stop.position,
      countryCode: stop.countryCode,
      country: stop.country,
      region: stop.region,
      city: stop.city,
      arrivalDate: stop.arrivalDate,
      departureDate: stop.departureDate,
      visitStatus: stop.visitStatus,
    })}>\n`;
    xml += element("knownFor", stop.knownFor, "    ");
    xml += element("goodToKnow", stop.goodToKnow, "    ");

    for (const person of stop.people) {
      xml += `    <recipient${attributes({
        id: person.id,
        name: person.name,
        relationship: person.relationship,
        ageGroup: person.ageGroup,
      })}>\n`;
      for (const item of person.recommendations) {
        xml += `      <souvenir${attributes({
          id: item.souvenirId,
          category: item.category,
          priceTier: item.priceTier,
          status: item.status,
          score: item.score,
        })}>\n`;
        xml += element("name", item.name, "        ");
        xml += element("description", item.description, "        ");
        for (const reason of item.reasons) {
          xml += element("reason", reason, "        ");
        }
        xml += "      </souvenir>\n";
      }
      xml += "    </recipient>\n";
    }
    xml += "  </stop>\n";
  }

  return `${xml}</recommendations>\n`;
}

/* ------------------------------- HTML ------------------------------- */

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** A self-contained page, readable on its own and laid out for printing. */
export function toHtml(document: ExportDocument): string {
  const h = escapeHtml;
  const place = (stop: ExportDocument["stops"][number]) =>
    [stop.city, stop.region, stop.country].filter(Boolean).join(", ");

  const stops = document.stops
    .map((stop) => {
      const people = stop.people
        .map((person) => {
          const items = person.recommendations
            .map(
              (item) => `
          <li class="${item.status}">
            <strong>${h(item.name)}</strong>
            <span class="meta">${h(item.priceTier)}${item.status === "bought" ? " · bought" : ""}</span>
            <p>${h(item.description)}</p>
            ${item.reasons.length ? `<p class="meta">${h(item.reasons.join(" · "))}</p>` : ""}
          </li>`,
            )
            .join("");
          return `
        <h3>For ${h(person.name)} <span class="meta">${h(person.relationship)} · ${h(person.ageGroup)}</span></h3>
        ${items ? `<ul>${items}\n        </ul>` : '<p class="meta">No suggestions.</p>'}`;
        })
        .join("");

      const notes =
        stop.knownFor || stop.goodToKnow
          ? `
        <dl>
          ${stop.knownFor ? `<dt>Known for</dt><dd>${h(stop.knownFor)}</dd>` : ""}
          ${stop.goodToKnow ? `<dt>Good to know</dt><dd>${h(stop.goodToKnow)}</dd>` : ""}
        </dl>`
          : "";

      return `
      <section>
        <h2>${stop.position}. ${h(place(stop))}</h2>
        <p class="meta">${h(stop.arrivalDate)} to ${h(stop.departureDate)}</p>${notes}${people}
      </section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${h(document.trip.name)} · Souvenir recommendations</title>
    <style>
      body { font: 16px/1.5 system-ui, sans-serif; max-width: 46rem; margin: 2rem auto; padding: 0 1rem; color: #18181b; }
      h1 { margin-bottom: 0; } h2 { margin-top: 2.5rem; border-top: 1px solid #d4d4d8; padding-top: 1.5rem; }
      h3 { margin-bottom: .25rem; } ul { list-style: none; padding: 0; margin: .5rem 0; }
      li { border: 1px solid #e4e4e7; border-radius: .5rem; padding: .6rem .8rem; margin-bottom: .5rem; break-inside: avoid; }
      li.bought { border-color: #6ee7b7; background: #ecfdf5; }
      li p { margin: .25rem 0 0; } .meta { color: #52525b; font-size: .875rem; font-weight: normal; }
      dl { background: #f4f4f5; border-radius: .5rem; padding: .75rem 1rem; font-size: .875rem; }
      dt { font-weight: 600; } dd { margin: 0 0 .5rem; } dd:last-child { margin-bottom: 0; }
      @media print { body { margin: 0; max-width: none; } }
    </style>
  </head>
  <body>
    <h1>${h(document.trip.name)}</h1>
    <p class="meta">Souvenir recommendations · generated ${h(document.generatedAt.slice(0, 10))}</p>${stops}
  </body>
</html>
`;
}

/* ------------------------- Choosing the format ----------------------- */

export const EXPORT_FORMATS = ["json", "csv", "xml", "html"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const CONTENT_TYPES: Record<ExportFormat, string> = {
  json: "application/json; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  html: "text/html; charset=utf-8",
};

/**
 * Picks the response format: an explicit `?format=` wins, otherwise the
 * request's Accept header decides, and JSON is the default. Returns null
 * for a `format` value that is not supported.
 */
export function pickFormat(
  formatParam: string | null,
  acceptHeader: string | null,
): ExportFormat | null {
  if (formatParam !== null) {
    const wanted = formatParam.toLowerCase();
    return EXPORT_FORMATS.find((format) => format === wanted) ?? null;
  }
  const accept = (acceptHeader ?? "").toLowerCase();
  if (accept.includes("text/csv")) return "csv";
  if (accept.includes("application/xml") || accept.includes("text/xml")) return "xml";
  // Browsers list text/html first; API clients asking for JSON do not.
  if (accept.includes("text/html") && !accept.includes("application/json")) return "html";
  return "json";
}

export function render(document: ExportDocument, format: ExportFormat): string {
  switch (format) {
    case "json":
      return toJson(document);
    case "csv":
      return toCsv(document);
    case "xml":
      return toXml(document);
    case "html":
      return toHtml(document);
  }
}
