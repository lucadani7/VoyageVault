import type { Metadata } from "next";
import Link from "next/link";
import { TripList, type TripSummary } from "@/components/trips/trip-list";
import { mutedClass, primaryButtonClass } from "@/components/ui";
import { placeLabel } from "@/lib/countries";
import { formatDateRange } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { getTrips } from "@/lib/trips";

export const metadata: Metadata = { title: "Your trips · VoyageVault" };

export default async function TripsPage() {
  const user = await requireUser();
  const trips = await getTrips(user.id);

  const summaries: TripSummary[] = trips.map((trip) => ({
    id: trip.id,
    name: trip.name,
    dateRange:
      trip.firstDate && trip.lastDate
        ? formatDateRange(trip.firstDate, trip.lastDate)
        : null,
    places: trip.stops.map((stop) => placeLabel(stop)),
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Your trips</h1>
        <Link href="/trips/new" className={primaryButtonClass}>
          New trip
        </Link>
      </div>

      {summaries.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="font-medium">No trips yet</p>
          <p className={`mt-1 ${mutedClass}`}>
            Create your first trip and add the places you are visiting.
          </p>
        </div>
      ) : (
        <TripList trips={summaries} />
      )}
    </main>
  );
}
