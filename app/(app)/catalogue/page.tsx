import type { Metadata } from "next";
import { CountrySelect } from "@/components/catalogue/country-select";
import { mutedClass } from "@/components/ui";
import { getCataloguedCountries, getCountryCatalogue } from "@/lib/catalogue";
import { countryName } from "@/lib/countries";
import { requireUser } from "@/lib/session";
import {
  AGE_GROUP_LABELS,
  AGE_GROUPS,
  CATEGORY_LABELS,
  INTEREST_LABELS,
  PRICE_LABELS,
} from "@/lib/vocabulary";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata: Metadata = { title: "Catalogue · VoyageVault" };

const monthName = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
const months = (numbers: number[]) =>
  numbers
    .map((month) => monthName.format(new Date(Date.UTC(2000, month - 1, 1))))
    .join(", ");

export default async function CataloguePage({ searchParams }: Props) {
  await requireUser();

  const param = (await searchParams).country;
  const code = (typeof param === "string" ? param : "").toUpperCase();
  const [countries, catalogue] = await Promise.all([
    getCataloguedCountries(),
    code ? getCountryCatalogue(code) : null,
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Souvenir catalogue</h1>
      <p className={`mt-1 ${mutedClass}`}>
        What each of {countries.length} countries and territories is known
        for, and what to bring home from it.
      </p>

      <div className="mt-6">
        <CountrySelect countries={countries} selected={catalogue ? code : ""} />
      </div>

      {code && !catalogue && (
        <p className={`mt-6 ${mutedClass}`}>
          The catalogue has nothing for this place yet.
        </p>
      )}

      {catalogue && (
        <>
          <h2 className="mt-8 text-xl font-semibold">{countryName(code)}</h2>
          <dl className="mt-3 grid gap-3 rounded-xl bg-zinc-100 p-4 text-sm sm:grid-cols-2 dark:bg-zinc-900">
            <div>
              <dt className="font-semibold">Known for</dt>
              <dd className="mt-0.5">{catalogue.notes.knownFor}</dd>
            </div>
            <div>
              <dt className="font-semibold">Good to know</dt>
              <dd className="mt-0.5">{catalogue.notes.goodToKnow}</dd>
            </div>
          </dl>

          <p className={`mt-6 ${mutedClass}`}>
            {catalogue.items.length} souvenirs
          </p>
          <ul className="mt-2 flex flex-col gap-3">
            {catalogue.items.map((item) => {
              const everyone = item.ageGroups.length === AGE_GROUPS.length;
              const details = [
                CATEGORY_LABELS[item.category],
                PRICE_LABELS[item.priceTier],
                item.region && `From ${item.region}`,
                item.seasonMonths.length > 0 &&
                  `Best in ${months(item.seasonMonths)}`,
                everyone
                  ? "All ages"
                  : `For: ${item.ageGroups
                      .map((age) => AGE_GROUP_LABELS[age].split(" (")[0])
                      .join(", ")}`,
              ].filter(Boolean);

              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="mt-1 text-sm">{item.description}</p>
                  <p className={`mt-2 ${mutedClass}`}>{details.join(" · ")}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium dark:bg-zinc-800"
                      >
                        {INTEREST_LABELS[tag] ?? tag}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
