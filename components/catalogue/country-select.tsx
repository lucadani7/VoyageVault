"use client";

import { useRouter } from "next/navigation";
import { inputClass } from "@/components/ui";

/** Picks the country to browse; choosing one loads its page straight away. */
export function CountrySelect({
  countries,
  selected,
}: {
  countries: { code: string; name: string }[];
  selected: string;
}) {
  const router = useRouter();

  return (
    <select
      aria-label="Country"
      value={selected}
      onChange={(event) =>
        router.push(`/catalogue?country=${event.target.value}`)
      }
      className={`${inputClass} ${selected ? "" : "text-zinc-500"}`}
    >
      <option value="" hidden>
        Choose a country
      </option>
      {countries.map((country) => (
        <option key={country.code} value={country.code}>
          {country.name}
        </option>
      ))}
    </select>
  );
}
