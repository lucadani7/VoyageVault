import {
  type AgeGroup,
  INTEREST_TAGS,
  type InterestTag,
  type PriceTier,
  type SouvenirCategory,
} from "@/lib/vocabulary";

/** One souvenir, as stored in the database. */
export type CatalogEntry = {
  slug: string;
  countryCode: string;
  region?: string;
  category: SouvenirCategory;
  priceTier: PriceTier;
  /** Months 1-12 when it fits best; omit for all year. */
  seasonMonths?: number[];
  /** A drink without alcohol; not stored, only used by the catalogue check. */
  nonAlcoholic?: boolean;
  ageGroups: AgeGroup[];
  tags: InterestTag[];
  name: string;
  description: string;
};

/** The two lines of context shown for a country. */
export type CountryNotes = {
  code: string;
  /** What the country is known for. */
  knownFor: string;
  /** A practical, verifiable tip about traveling there or bringing things home. */
  goodToKnow: string;
};

export type CountrySeed = { notes: CountryNotes; entries: CatalogEntry[] };

const AGES = {
  all: ["child", "teen", "adult", "senior"],
  kids: ["child", "teen"],
  child: ["child"],
  "teens+": ["teen", "adult", "senior"],
  "teens-adults": ["teen", "adult"],
  adults: ["adult", "senior"],
} as const satisfies Record<string, readonly AgeGroup[]>;

type Extra = {
  /** Set only when the souvenir belongs to one region or city. */
  region?: string;
  /** Months 1-12 when it fits best. */
  months?: number[];
  /** Marks a drink as non-alcoholic, so it may be suggested for any age. */
  soft?: boolean;
};

/**
 * One souvenir, written as a row to keep a thousand of them readable:
 * [id, category, price, ages, tags, name, description, extra?]
 * - id is unique within the country; the country code is prefixed for you
 * - tags are space-separated words from INTEREST_TAGS
 */
export type Row = [
  id: string,
  category: SouvenirCategory,
  price: PriceTier,
  ages: keyof typeof AGES,
  tags: string,
  name: string,
  description: string,
  extra?: Extra,
];

const knownTags = new Set<string>(INTEREST_TAGS);

export function country(
  code: string,
  knownFor: string,
  goodToKnow: string,
  rows: Row[] = [],
): CountrySeed {
  const entries = rows.map(
    ([id, category, priceTier, ages, tags, name, description, extra]) => {
      const tagList = tags.split(" ").filter(Boolean);
      for (const tag of tagList) {
        if (!knownTags.has(tag)) {
          throw new Error(`${code} ${id}: unknown tag "${tag}"`);
        }
      }
      const entry: CatalogEntry = {
        slug: `${code.toLowerCase()}-${id}`,
        countryCode: code,
        category,
        priceTier,
        ageGroups: [...AGES[ages]],
        tags: tagList as InterestTag[],
        name,
        description,
      };
      if (extra?.region) entry.region = extra.region;
      if (extra?.months) entry.seasonMonths = extra.months;
      if (extra?.soft) entry.nonAlcoholic = true;
      return entry;
    },
  );
  return { notes: { code, knownFor, goodToKnow }, entries };
}
