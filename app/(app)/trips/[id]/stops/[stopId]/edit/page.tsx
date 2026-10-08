import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StopForm } from "@/components/trips/stop-form";
import { mutedClass } from "@/components/ui";
import { listCountries, placeLabel } from "@/lib/countries";
import { requireUser } from "@/lib/session";
import { getTrip } from "@/lib/trips";

type Props = { params: Promise<{ id: string; stopId: string }> };

export const metadata: Metadata = { title: "Edit stop · VoyageVault" };

export default async function EditStopPage({ params }: Props) {
  const user = await requireUser();
  const { id, stopId } = await params;
  const trip = await getTrip(user.id, id);
  const stop = trip?.stops.find((item) => item.id === stopId);
  if (!trip || !stop) notFound();

  // Stops saved before places were picked from a list have no reference;
  // the user is asked to choose the place again.
  const place =
    stop.placeRef && stop.lat !== null && stop.lng !== null
      ? {
          ref: stop.placeRef,
          kind: stop.city ? ("city" as const) : ("region" as const),
          city: stop.city,
          region: stop.region,
          lat: stop.lat,
          lng: stop.lng,
          label: [stop.city, stop.region].filter(Boolean).join(", "),
        }
      : null;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <p className={mutedClass}>{trip.name}</p>
      <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight">
        Edit {placeLabel(stop)}
      </h1>
      {!place && (
        <p className={`mt-2 ${mutedClass}`}>
          This stop was saved before places were chosen from a list. Pick the
          city or region again to get the map of shops and regional
          suggestions.
        </p>
      )}
      <div className="mt-6">
        <StopForm
          tripId={trip.id}
          stopId={stop.id}
          countries={listCountries()}
          initialValues={{
            countryCode: stop.countryCode,
            place,
            visitStatus: stop.visitStatus ?? "",
            arrivalDate: stop.arrivalDate,
            departureDate: stop.departureDate,
          }}
        />
      </div>
    </main>
  );
}
