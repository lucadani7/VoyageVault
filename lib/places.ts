import { countryName, isCountryCode } from "./countries";

/**
 * Place lookup through Photon, a free geocoder built on OpenStreetMap data
 * that (unlike Nominatim) permits search-as-you-type.
 */
const PHOTON_URL = "https://photon.komoot.io/api/";
const USER_AGENT = "VoyageVault (https://github.com/lucadani7/VoyageVault)";

export type Place = {
  /** OpenStreetMap reference such as "R42602"; stable across languages. */
  ref: string;
  kind: "city" | "region";
  city: string | null;
  region: string | null;
  lat: number;
  lng: number;
  /** What the user sees, e.g. "Florence, Tuscany". */
  label: string;
};

export type CountryView = {
  center: [number, number];
  /** [[south, west], [north, east]], or null when too spread out to frame. */
  bounds: [[number, number], [number, number]] | null;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_type?: string;
    osm_id?: number;
    type?: string;
    name?: string;
    state?: string;
    extent?: [number, number, number, number];
  };
};

async function photon(params: [string, string][]): Promise<PhotonFeature[]> {
  const url = `${PHOTON_URL}?${new URLSearchParams(params)}`;
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Photon responded ${response.status}`);
  const data = (await response.json()) as { features?: PhotonFeature[] };
  return data.features ?? [];
}

/** Cities and regions in one country whose name starts like `query`. */
export async function searchPlaces(
  countryCode: string,
  query: string,
  lang = "en",
): Promise<Place[]> {
  if (!isCountryCode(countryCode) || query.length < 2) return [];

  const features = await photon([
    ["q", query],
    ["countrycode", countryCode],
    ["layer", "city"],
    ["layer", "state"],
    ["limit", "8"],
    ["lang", lang],
  ]);

  const places: Place[] = [];
  const seen = new Set<string>();
  for (const { geometry, properties } of features) {
    const [lng, lat] = geometry?.coordinates ?? [];
    const name = properties?.name;
    if (!properties?.osm_type || !properties.osm_id || !name) continue;
    if (typeof lat !== "number" || typeof lng !== "number") continue;

    const isRegion = properties.type === "state";
    const region = isRegion ? name : (properties.state ?? null);
    const label = isRegion || !region ? name : `${name}, ${region}`;
    if (seen.has(label)) continue;
    seen.add(label);

    places.push({
      ref: `${properties.osm_type}${properties.osm_id}`,
      kind: isRegion ? "region" : "city",
      city: isRegion ? null : name,
      region,
      lat,
      lng,
      label,
    });
  }
  return places;
}

// Countries do not move, so one lookup per server instance is plenty.
const countryViews = new Map<string, CountryView | null>();

/** Where to point the map for a country: its centre and, if compact, its outline. */
export async function getCountryView(
  countryCode: string,
): Promise<CountryView | null> {
  if (!isCountryCode(countryCode)) return null;
  if (countryViews.has(countryCode)) return countryViews.get(countryCode)!;

  const [feature] = await photon([
    ["q", countryName(countryCode)],
    ["countrycode", countryCode],
    ["layer", "country"],
    ["limit", "1"],
    ["lang", "en"],
  ]);

  let view: CountryView | null = null;
  const [lng, lat] = feature?.geometry?.coordinates ?? [];
  if (typeof lat === "number" && typeof lng === "number") {
    view = { center: [lat, lng], bounds: null };

    const extent = feature?.properties?.extent;
    if (extent) {
      const [west, latA, east, latB] = extent;
      // Overseas territories (France, USA...) stretch the outline across
      // oceans; in that case centre on the mainland instead of framing it.
      if (east > west && east - west < 40) {
        view.bounds = [
          [Math.min(latA, latB), west],
          [Math.max(latA, latB), east],
        ];
      }
    }
  }

  countryViews.set(countryCode, view);
  return view;
}
