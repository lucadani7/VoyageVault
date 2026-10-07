"use client";

import Link from "next/link";
import { useState } from "react";
import { DeleteAllTripsButton } from "@/components/trips/delete-all-trips-button";
import { DeleteTripButton } from "@/components/trips/delete-trip-button";
import { inputClass, mutedClass } from "@/components/ui";

export type TripSummary = {
  id: string;
  name: string;
  /** Already formatted, e.g. "Sep 5 – 9, 2025"; null when there are no stops. */
  dateRange: string | null;
  /** One label per stop in travel order, e.g. "Florence, Tuscany, Italy". */
  places: string[];
};

// Lower-case and strip accents, so "florenta" finds "Florența".
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function TripList({ trips }: { trips: TripSummary[] }) {
  const [query, setQuery] = useState("");

  const words = normalize(query).split(/\s+/).filter(Boolean);
  const visible = trips.filter((trip) => {
    const haystack = normalize([trip.name, ...trip.places].join(" "));
    return words.every((word) => haystack.includes(word));
  });

  return (
    <>
      <div className="mt-6">
        <input
          type="search"
          aria-label="Search trips"
          placeholder="Search by trip name, city, region or country"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={inputClass}
        />
      </div>

      {visible.length === 0 ? (
        <p className={`mt-6 ${mutedClass}`}>
          No trips match “{query.trim()}”.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {visible.map((trip) => (
            <li
              key={trip.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800"
            >
              <Link
                href={`/trips/${trip.id}`}
                className="block rounded-t-xl p-5 pb-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <h2 className="text-lg font-semibold">{trip.name}</h2>
                {trip.places.length === 0 ? (
                  <p className={`mt-1 ${mutedClass}`}>No stops yet</p>
                ) : (
                  <>
                    {trip.dateRange && (
                      <p className={`mt-1 ${mutedClass}`}>{trip.dateRange}</p>
                    )}
                    <ol className="mt-3 flex flex-col gap-1 text-sm">
                      {trip.places.map((place, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="w-5 shrink-0 text-zinc-500">
                            {index + 1}.
                          </span>
                          {place}
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </Link>
              <div className="border-t border-zinc-200 px-4 py-1 dark:border-zinc-800">
                <DeleteTripButton tripId={trip.id} label="Delete" />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10">
        <DeleteAllTripsButton count={trips.length} />
      </div>
    </>
  );
}
