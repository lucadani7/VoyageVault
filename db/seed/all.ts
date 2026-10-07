import { catalog as featuredSouvenirs, type CatalogEntry } from "./catalog";
import { africa } from "./countries/africa";
import { americas } from "./countries/americas";
import { asia } from "./countries/asia";
import { europe } from "./countries/europe";
import { featured } from "./countries/featured";
import { oceania } from "./countries/oceania";
import type { CountryNotes } from "./define";

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

/** Every souvenir: the original twelve countries plus the rest of the world. */
export const allSouvenirs: CatalogEntry[] = [
  ...featuredSouvenirs,
  ...countries.flatMap((entry) => entry.entries),
];
