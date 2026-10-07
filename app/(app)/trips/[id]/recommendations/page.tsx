import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  dangerLinkClass,
  mutedClass,
  plainLinkClass,
  primaryButtonClass,
  quietLinkClass,
} from "@/components/ui";
import { placeLabel } from "@/lib/countries";
import { formatDateRange } from "@/lib/format";
import {
  getTripRecommendations,
  type RecommendationItem,
} from "@/lib/recommendations";
import { PRICE_LABELS } from "@/lib/recommender/explain";
import { requireUser } from "@/lib/session";
import {
  AGE_GROUP_LABELS,
  type RecommendationStatus,
  RELATIONSHIP_LABELS,
} from "@/lib/vocabulary";
import { StopShops } from "@/components/shops/stop-shops";
import { setRecommendationStatus } from "./actions";

type Props = { params: Promise<{ id: string }> };

const EXPORTS = [
  { format: "html", label: "Printable page", download: false },
  { format: "csv", label: "CSV", download: true },
  { format: "json", label: "JSON", download: true },
  { format: "xml", label: "XML", download: true },
] as const;

export const metadata: Metadata = { title: "Recommendations · VoyageVault" };

/** Hidden fields identifying one suggestion, plus a button per decision. */
function Decide({
  ids,
  souvenirId,
  options,
}: {
  ids: { tripId: string; stopId: string; recipientId: string };
  souvenirId: string;
  options: { status: RecommendationStatus; label: string; className: string }[];
}) {
  return (
    <form action={setRecommendationStatus} className="flex flex-wrap gap-x-4">
      <input type="hidden" name="tripId" value={ids.tripId} />
      <input type="hidden" name="stopId" value={ids.stopId} />
      <input type="hidden" name="recipientId" value={ids.recipientId} />
      <input type="hidden" name="souvenirId" value={souvenirId} />
      {options.map((option) => (
        <button
          key={option.status}
          type="submit"
          name="status"
          value={option.status}
          className={option.className}
        >
          {option.label}
        </button>
      ))}
    </form>
  );
}

function Souvenir({
  item,
  bought = false,
  children,
}: {
  item: RecommendationItem;
  bought?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={`rounded-lg border px-4 pt-3 pb-1 ${
        bought
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-medium">
          {bought && <span aria-hidden="true">✓ </span>}
          {item.name}
        </p>
        <span className="text-xs text-zinc-500">{PRICE_LABELS[item.priceTier]}</span>
      </div>
      <p className="mt-1 text-sm">{item.description}</p>
      {item.reasons.length > 0 && (
        <p className={`mt-1.5 ${mutedClass}`}>{item.reasons.join(" · ")}</p>
      )}
      {item.outOfSeason && (
        <p className={`mt-1.5 ${mutedClass}`}>
          Usually sold at another time of year.
        </p>
      )}
      {children}
    </li>
  );
}

export default async function RecommendationsPage({ params }: Props) {
  const user = await requireUser();
  const data = await getTripRecommendations(user.id, (await params).id);
  if (!data) notFound();

  const { trip, people, stops } = data;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href={`/trips/${trip.id}`} className={`${mutedClass} hover:underline`}>
        ← {trip.name}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Souvenir recommendations
      </h1>

      {stops.length > 0 && people.length > 0 && (
        <nav
          aria-label="Export"
          className="mt-3 flex flex-wrap items-center gap-x-4 text-sm"
        >
          <span className={mutedClass}>Export this list:</span>
          {EXPORTS.map(({ format, label, download }) => (
            <a
              key={format}
              href={`/api/v1/trips/${trip.id}/recommendations?format=${format}${
                download ? "&download=1" : ""
              }`}
              // The printable page opens in a new tab; the rest download.
              target={download ? undefined : "_blank"}
              rel={download ? undefined : "noreferrer"}
              className={plainLinkClass}
            >
              {label}
            </a>
          ))}
        </nav>
      )}

      {stops.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="font-medium">This trip has no stops yet</p>
          <p className={`mt-1 ${mutedClass}`}>
            Add the places you are visiting to get suggestions for each one.
          </p>
          <Link href={`/trips/${trip.id}`} className={`mt-4 ${primaryButtonClass}`}>
            Add a stop
          </Link>
        </div>
      ) : people.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="font-medium">Who are the souvenirs for?</p>
          <p className={`mt-1 ${mutedClass}`}>
            Add the people you are bringing gifts home to; suggestions are
            matched to each of them.
          </p>
          <Link href="/recipients/new" className={`mt-4 ${primaryButtonClass}`}>
            Add person
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-12">
          {stops.map(({ stop, notes, usesGeneric, people: perPerson }, index) => (
            <section key={stop.id}>
              <h2 className="text-xl font-semibold">
                {index + 1}. {placeLabel(stop)}
              </h2>
              <p className={mutedClass}>
                {formatDateRange(stop.arrivalDate, stop.departureDate)}
              </p>

              {notes && (
                <dl className="mt-4 grid gap-3 rounded-xl bg-zinc-100 p-4 text-sm sm:grid-cols-2 dark:bg-zinc-900">
                  <div>
                    <dt className="font-semibold">Known for</dt>
                    <dd className="mt-0.5">{notes.knownFor}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Good to know</dt>
                    <dd className="mt-0.5">{notes.goodToKnow}</dd>
                  </div>
                </dl>
              )}
              {usesGeneric && (
                <p className={`mt-4 ${mutedClass}`}>
                  The catalogue has nothing specific to this place yet, so
                  these are ideas that work anywhere.
                </p>
              )}

              {stop.lat !== null && stop.lng !== null && (
                <StopShops
                  tripId={trip.id}
                  stopId={stop.id}
                  center={{ lat: stop.lat, lng: stop.lng }}
                />
              )}

              <div className="mt-6 flex flex-col gap-6">
                {perPerson.map(({ recipient, bought, suggested, dismissed }) => {
                  const ids = {
                    tripId: trip.id,
                    stopId: stop.id,
                    recipientId: recipient.id,
                  };
                  return (
                    <div key={recipient.id}>
                      <h3 className="font-semibold">
                        For {recipient.name}
                        <span className="ml-2 text-sm font-normal text-zinc-500">
                          {RELATIONSHIP_LABELS[recipient.relationship]} ·{" "}
                          {AGE_GROUP_LABELS[recipient.ageGroup]}
                        </span>
                      </h3>

                      {bought.length + suggested.length === 0 && (
                        <p className={`mt-2 ${mutedClass}`}>
                          No more suggestions for {recipient.name} here.
                        </p>
                      )}

                      <ul className="mt-2 flex flex-col gap-2">
                        {bought.map((item) => (
                          <Souvenir key={item.souvenirId} item={item} bought>
                            <Decide
                              ids={ids}
                              souvenirId={item.souvenirId}
                              options={[
                                { status: "suggested", label: "Undo bought", className: plainLinkClass },
                              ]}
                            />
                          </Souvenir>
                        ))}
                        {suggested.map((item) => (
                          <Souvenir key={item.souvenirId} item={item}>
                            <Decide
                              ids={ids}
                              souvenirId={item.souvenirId}
                              options={[
                                { status: "bought", label: "Bought", className: plainLinkClass },
                                { status: "dismissed", label: "Not for them", className: dangerLinkClass },
                              ]}
                            />
                          </Souvenir>
                        ))}
                      </ul>

                      {dismissed.length > 0 && (
                        <details className="mt-2">
                          <summary className={`cursor-pointer py-2 ${mutedClass}`}>
                            Dismissed ({dismissed.length})
                          </summary>
                          <ul className="flex flex-col">
                            {dismissed.map((item) => (
                              <li
                                key={item.souvenirId}
                                className="flex flex-wrap items-center justify-between gap-x-3"
                              >
                                <span className={mutedClass}>{item.name}</span>
                                <Decide
                                  ids={ids}
                                  souvenirId={item.souvenirId}
                                  options={[
                                    { status: "suggested", label: "Restore", className: quietLinkClass },
                                  ]}
                                />
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
