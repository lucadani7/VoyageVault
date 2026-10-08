import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteStop, deleteTrip } from "@/app/(app)/trips/actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { StopForm } from "@/components/trips/stop-form";
import { TripTitle } from "@/components/trips/trip-title";
import {
  dangerLinkClass,
  mutedClass,
  primaryButtonClass,
  quietLinkClass,
} from "@/components/ui";
import { listCountries, placeLabel } from "@/lib/countries";
import { formatDateRange } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { getTrip } from "@/lib/trips";
import { VISIT_STATUS_LABELS } from "@/lib/visit-status";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await requireUser();
  const trip = await getTrip(user.id, (await params).id);
  return { title: `${trip?.name ?? "Trip"} · VoyageVault` };
}

export default async function TripPage({ params }: Props) {
  const user = await requireUser();
  const trip = await getTrip(user.id, (await params).id);
  if (!trip) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href="/trips" className={`${mutedClass} hover:underline`}>
        ← All trips
      </Link>
      <div className="mt-3">
        <TripTitle tripId={trip.id} name={trip.name} />
      </div>

      {trip.stops.length > 0 && (
        <div className="mt-6">
          <Link
            href={`/trips/${trip.id}/recommendations`}
            className={primaryButtonClass}
          >
            See souvenir recommendations
          </Link>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Stops</h2>
        {trip.stops.length === 0 ? (
          <p className={`mt-2 ${mutedClass}`}>
            No stops yet. Add the first place you are visiting below.
          </p>
        ) : (
          <ol className="mt-3 flex flex-col gap-3">
            {trip.stops.map((stop, index) => (
              <li
                key={stop.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 py-3 pl-4 pr-3 dark:border-zinc-800"
              >
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium dark:bg-zinc-800">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words font-medium">
                      {placeLabel(stop)}
                    </p>
                    <p className={mutedClass}>
                      {formatDateRange(stop.arrivalDate, stop.departureDate)}
                      {stop.visitStatus &&
                        ` · ${VISIT_STATUS_LABELS[stop.visitStatus]}`}
                    </p>
                    {!stop.placeRef && (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Edit to choose the place from the list for shops and
                        regional suggestions.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-x-3">
                  <Link
                    href={`/trips/${trip.id}/stops/${stop.id}/edit`}
                    className={quietLinkClass}
                  >
                    Edit
                  </Link>
                  <form action={deleteStop}>
                    <input type="hidden" name="tripId" value={trip.id} />
                    <input type="hidden" name="stopId" value={stop.id} />
                    <button type="submit" className={dangerLinkClass}>
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-10 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Add a stop</h2>
        <div className="mt-4">
          <StopForm tripId={trip.id} countries={listCountries()} />
        </div>
      </section>

      <div className="mt-10">
        <ConfirmDeleteButton
          action={deleteTrip}
          fields={{ tripId: trip.id }}
          label="Delete trip"
          question="Delete this trip and all its stops?"
        />
      </div>
    </main>
  );
}
