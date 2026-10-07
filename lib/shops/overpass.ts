/**
 * Finding places that sell souvenirs in OpenStreetMap data, through the
 * Overpass API. This file is the pure part: building the query and turning
 * the answer into shops. No network, no database, so it is fully testable.
 */

export const SHOP_KINDS = ["gift", "craft", "market", "sweets", "antiques", "museum"] as const;
export type ShopKind = (typeof SHOP_KINDS)[number];

export const SHOP_KIND_LABELS: Record<ShopKind, string> = {
  gift: "Gift and souvenir shop",
  craft: "Crafts and art",
  market: "Market",
  sweets: "Sweets and chocolate",
  antiques: "Antiques",
  museum: "Museum",
};

export type Shop = {
  /** OpenStreetMap reference, e.g. "node/123". */
  id: string;
  name: string;
  kind: ShopKind;
  lat: number;
  lng: number;
  /** Metres from the centre of the stop, as the crow flies. */
  distance: number;
  address: string | null;
  website: string | null;
  openingHours: string | null;
};

/** Which OpenStreetMap `shop=` values count, and as what. */
const SHOP_TAGS: Record<string, ShopKind> = {
  gift: "gift",
  souvenir: "gift",
  craft: "craft",
  art: "craft",
  pottery: "craft",
  chocolate: "sweets",
  confectionery: "sweets",
  antiques: "antiques",
};

/** How far to look: a city is walked, a region is driven. */
export const CITY_RADIUS = 3_000;
export const REGION_RADIUS = 15_000;
export const MAX_SHOPS = 60;

export function buildQuery(lat: number, lng: number, radius: number): string {
  const around = `(around:${radius},${lat},${lng})`;
  const shops = Object.keys(SHOP_TAGS).join("|");
  return `[out:json][timeout:20];
(
  nwr${around}["shop"~"^(${shops})$"]["name"];
  nwr${around}["amenity"="marketplace"]["name"];
  nwr${around}["tourism"="museum"]["name"];
);
out center tags 300;`;
}

/** Great-circle distance in metres. */
export function distanceBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6_371_000 * Math.asin(Math.sqrt(h)));
}

type OverpassElement = {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

function kindOf(tags: Record<string, string>): ShopKind | null {
  if (tags.shop && SHOP_TAGS[tags.shop]) return SHOP_TAGS[tags.shop];
  if (tags.amenity === "marketplace") return "market";
  if (tags.tourism === "museum") return "museum";
  return null;
}

/** Only real web addresses are passed on; anything else could be a script. */
function safeUrl(value: string | undefined): string | null {
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Turns an Overpass response into shops, nearest first. Unnamed places and
 * anything without coordinates are skipped; the list is capped so the map
 * stays readable in a dense city.
 */
export function parseOverpass(
  response: unknown,
  origin: { lat: number; lng: number },
): Shop[] {
  const elements =
    typeof response === "object" && response !== null && "elements" in response
      ? (response as { elements: unknown }).elements
      : null;
  if (!Array.isArray(elements)) return [];

  const shops: Shop[] = [];
  const seen = new Set<string>();

  for (const element of elements as OverpassElement[]) {
    const tags = element.tags ?? {};
    const name = tags.name?.trim();
    const kind = kindOf(tags);
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (!name || !kind || typeof lat !== "number" || typeof lng !== "number") continue;
    if (!element.type || typeof element.id !== "number") continue;

    // The same shop is sometimes mapped twice, as a point and as a building.
    const duplicateKey = `${name.toLowerCase()}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
    if (seen.has(duplicateKey)) continue;
    seen.add(duplicateKey);

    const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
    shops.push({
      id: `${element.type}/${element.id}`,
      name: name.slice(0, 120),
      kind,
      lat,
      lng,
      distance: distanceBetween(origin, { lat, lng }),
      address: street ? street.slice(0, 120) : null,
      website: safeUrl(tags.website ?? tags["contact:website"]),
      openingHours: tags.opening_hours?.slice(0, 200) ?? null,
    });
  }

  return shops.sort((a, b) => a.distance - b.distance).slice(0, MAX_SHOPS);
}
