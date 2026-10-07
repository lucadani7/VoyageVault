import type {
  AgeGroup,
  InterestTag,
  PriceTier,
  Relationship,
  SouvenirCategory,
} from "../vocabulary";

/**
 * The recommendation rules. Pure functions over plain data: no database,
 * no framework, so every rule can be read here and tested in isolation.
 */

export type ScorableSouvenir = {
  id: string;
  countryCode: string;
  region: string | null;
  category: SouvenirCategory;
  priceTier: PriceTier;
  /** Months 1-12 when it fits best; empty means all year. */
  seasonMonths: number[];
  ageGroups: AgeGroup[];
  tags: InterestTag[];
};

export type ScorableStop = {
  countryCode: string;
  region: string | null;
  city: string | null;
  /** "YYYY-MM-DD" */
  arrivalDate: string;
  departureDate: string;
};

export type ScorableRecipient = {
  relationship: Relationship;
  ageGroup: AgeGroup;
  interests: InterestTag[];
};

export type Reason =
  | { kind: "region"; region: string }
  | { kind: "season" }
  | { kind: "interests"; tags: InterestTag[] }
  | { kind: "relationship"; relationship: Relationship; priceTier: PriceTier };

export type Scored<T> = {
  souvenir: T;
  score: number;
  reasons: Reason[];
  /** True when the item is tied to months outside the stay. */
  outOfSeason: boolean;
};

/** Points awarded by each rule; tune the recommendations here. */
export const WEIGHTS = {
  regionMatch: 25,
  regionElsewhere: -10,
  inSeason: 20,
  outOfSeason: -15,
  perSharedInterest: 15,
  maxInterestPoints: 45,
} as const;

/**
 * How well each price level suits a relationship: generous for family,
 * modest for people you know less well.
 */
const PRICE_FIT: Record<Relationship, Record<PriceTier, number>> = {
  family: { budget: 0, mid: 5, premium: 10 },
  friend: { budget: 4, mid: 8, premium: 0 },
  acquaintance: { budget: 10, mid: 3, premium: -10 },
  classmate: { budget: 10, mid: 3, premium: -10 },
  coworker: { budget: 10, mid: 3, premium: -10 },
};

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/**
 * Does a souvenir's region match where the stop is? Compares against both
 * the stop's region and its city, and accepts one name containing the other
 * ("Provence" matches "Provence-Alpes-Côte d'Azur").
 */
export function regionMatches(souvenirRegion: string, stop: ScorableStop): boolean {
  const wanted = normalize(souvenirRegion);
  return [stop.region, stop.city].some((place) => {
    if (!place) return false;
    const actual = normalize(place);
    if (actual === wanted) return true;
    return (
      Math.min(actual.length, wanted.length) >= 4 &&
      (actual.includes(wanted) || wanted.includes(actual))
    );
  });
}

/** The calendar months (1-12) a stay touches, at most a full year. */
export function monthsOfStay(arrivalDate: string, departureDate: string): number[] {
  const [startYear, startMonth] = arrivalDate.split("-").map(Number);
  const [endYear, endMonth] = departureDate.split("-").map(Number);
  const span = Math.min(
    Math.max((endYear - startYear) * 12 + (endMonth - startMonth), 0),
    11,
  );
  return Array.from({ length: span + 1 }, (_, i) => ((startMonth - 1 + i) % 12) + 1);
}

/**
 * Scores one souvenir for one recipient at one stop, or returns null when
 * it must not be suggested at all: wrong country, or not suitable for the
 * recipient's age (which is what keeps alcohol away from children).
 */
export function scoreSouvenir<T extends ScorableSouvenir>(
  souvenir: T,
  stop: ScorableStop,
  recipient: ScorableRecipient,
  options: { anyCountry?: boolean } = {},
): Scored<T> | null {
  if (!options.anyCountry && souvenir.countryCode !== stop.countryCode) return null;
  if (!souvenir.ageGroups.includes(recipient.ageGroup)) return null;

  let score = 0;
  let outOfSeason = false;
  const reasons: Reason[] = [];

  if (souvenir.region) {
    if (regionMatches(souvenir.region, stop)) {
      score += WEIGHTS.regionMatch;
      reasons.push({ kind: "region", region: souvenir.region });
    } else {
      score += WEIGHTS.regionElsewhere;
    }
  }

  if (souvenir.seasonMonths.length > 0) {
    const stay = monthsOfStay(stop.arrivalDate, stop.departureDate);
    if (souvenir.seasonMonths.some((month) => stay.includes(month))) {
      score += WEIGHTS.inSeason;
      reasons.push({ kind: "season" });
    } else {
      score += WEIGHTS.outOfSeason;
      outOfSeason = true;
    }
  }

  const shared = souvenir.tags.filter((tag) => recipient.interests.includes(tag));
  if (shared.length > 0) {
    score += Math.min(
      shared.length * WEIGHTS.perSharedInterest,
      WEIGHTS.maxInterestPoints,
    );
    reasons.push({ kind: "interests", tags: shared });
  }

  const priceFit = PRICE_FIT[recipient.relationship][souvenir.priceTier];
  score += priceFit;
  if (priceFit >= 8) {
    reasons.push({
      kind: "relationship",
      relationship: recipient.relationship,
      priceTier: souvenir.priceTier,
    });
  }

  return { souvenir, score, reasons, outOfSeason };
}

/**
 * Ranks every suitable souvenir for a recipient at a stop, best first.
 * Ties are broken by id so the order never jumps between page loads.
 */
export function rankSouvenirs<T extends ScorableSouvenir>(
  souvenirs: T[],
  stop: ScorableStop,
  recipient: ScorableRecipient,
  options: { anyCountry?: boolean } = {},
): Scored<T>[] {
  return souvenirs
    .map((souvenir) => scoreSouvenir(souvenir, stop, recipient, options))
    .filter((scored): scored is Scored<T> => scored !== null)
    .sort((a, b) => b.score - a.score || a.souvenir.id.localeCompare(b.souvenir.id));
}

/**
 * Takes the best `limit` suggestions while keeping the list varied: at most
 * `perCategory` items of the same kind, so it is never five sweets in a row.
 */
export function pickVaried<T extends ScorableSouvenir>(
  ranked: Scored<T>[],
  limit: number,
  perCategory = 2,
): Scored<T>[] {
  const picked: Scored<T>[] = [];
  const used = new Map<SouvenirCategory, number>();
  for (const item of ranked) {
    if (picked.length === limit) break;
    const count = used.get(item.souvenir.category) ?? 0;
    if (count >= perCategory) continue;
    used.set(item.souvenir.category, count + 1);
    picked.push(item);
  }
  return picked;
}
