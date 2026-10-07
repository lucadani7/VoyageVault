"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { mutedClass, plainLinkClass, secondaryButtonClass } from "@/components/ui";
import { SHOP_KIND_LABELS, type Shop } from "@/lib/shops/overpass";
import { KIND_COLORS } from "./kind-colors";

const ShopMap = dynamic(() => import("./shop-map"), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-xl bg-zinc-100 sm:h-80 dark:bg-zinc-800" />
  ),
});

/** How many shops the list shows before "Show all". */
const SHORT_LIST = 8;

const distanceLabel = (metres: number) =>
  metres < 1000 ? `${Math.round(metres / 10) * 10} m` : `${(metres / 1000).toFixed(1)} km`;

type State =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; shops: Shop[] };

/**
 * "Where to buy" for one stop. Nothing is fetched until the user asks, so
 * opening the recommendations page never floods the map service.
 */
export function StopShops({
  tripId,
  stopId,
  center,
}: {
  tripId: string;
  stopId: string;
  center: { lat: number; lng: number };
}) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  async function load() {
    setState({ status: "loading" });
    try {
      const response = await fetch(`/api/v1/trips/${tripId}/stops/${stopId}/shops`);
      const data = (await response.json()) as {
        shops?: Shop[];
        error?: { message: string };
      };
      if (!response.ok || !data.shops) {
        throw new Error(data.error?.message ?? "Could not load the shops.");
      }
      setState({ status: "ready", shops: data.shops });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not load the shops.",
      });
    }
  }

  if (state.status !== "ready") {
    return (
      <div className="mt-6">
        <button
          type="button"
          onClick={load}
          disabled={state.status === "loading"}
          className={secondaryButtonClass}
        >
          {state.status === "loading" ? "Looking for shops…" : "Show where to buy souvenirs"}
        </button>
        {state.status === "error" && (
          <p role="alert" className={`mt-2 ${mutedClass}`}>
            {state.message} Try again in a moment.
          </p>
        )}
      </div>
    );
  }

  const { shops } = state;
  const listed = showAll ? shops : shops.slice(0, SHORT_LIST);
  const kinds = [...new Set(shops.map((shop) => shop.kind))];

  return (
    <div className="mt-6">
      <h3 className="font-semibold">Where to buy</h3>
      {shops.length === 0 ? (
        <p className={`mt-1 ${mutedClass}`}>
          OpenStreetMap lists no souvenir shops, markets or museums near this
          stop.
        </p>
      ) : (
        <>
          <p className={`mt-1 ${mutedClass}`}>
            {shops.length} places nearby, from OpenStreetMap. Opening hours
            and details may be out of date.
          </p>
          <div className="mt-3">
            <ShopMap
              center={center}
              shops={shops}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            {kinds.map((kind) => (
              <li key={kind} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: KIND_COLORS[kind] }}
                />
                {SHOP_KIND_LABELS[kind]}
              </li>
            ))}
          </ul>

          <ul className="mt-3 flex flex-col">
            {listed.map((shop) => (
              <li
                key={shop.id}
                className={`flex flex-wrap items-center justify-between gap-x-3 rounded-lg px-2 ${
                  shop.id === selectedId ? "bg-zinc-100 dark:bg-zinc-800" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(shop.id)}
                  className="flex min-h-10 min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm"
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: KIND_COLORS[shop.kind] }}
                  />
                  <span className="min-w-0">
                    <span className="block break-words font-medium">{shop.name}</span>
                    <span className="block text-zinc-600 dark:text-zinc-400">
                      {[SHOP_KIND_LABELS[shop.kind], shop.address, shop.openingHours]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </button>
                <span className="flex items-center gap-x-3 text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {distanceLabel(shop.distance)}
                  </span>
                  {shop.website && (
                    <a
                      href={shop.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={plainLinkClass}
                    >
                      Website
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {shops.length > SHORT_LIST && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className={plainLinkClass}
            >
              {showAll ? "Show fewer" : `Show all ${shops.length}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
