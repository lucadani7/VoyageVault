import { africa } from "./countries/africa";
import { americas } from "./countries/americas";
import { asia } from "./countries/asia";
import { europe } from "./countries/europe";
import { featured } from "./countries/featured";
import { oceania } from "./countries/oceania";
import type { CatalogEntry, CountryNotes } from "./define";
import { generic } from "./generic";

const countries = [
  ...featured,
  ...europe,
  ...asia,
  ...africa,
  ...americas,
  ...oceania,
];

/** "Known for" and "Good to know" for every covered country. */
export const allNotes: CountryNotes[] = countries.map((entry) => entry.notes);

/** Every souvenir in the catalogue, plus the fallback ideas for anywhere. */
export const allSouvenirs: CatalogEntry[] = [
  ...countries.flatMap((entry) => entry.entries),
  ...generic,
];
