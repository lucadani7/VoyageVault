"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { CountryView, Place } from "@/lib/places";

/**
 * Shows the chosen country, then zooms to the chosen place. Leaflet needs
 * the browser's `window`, so load this component with `ssr: false`.
 */
export default function PlaceMap({
  view,
  place,
}: {
  view: CountryView | null;
  place: Place | null;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!element.current) return;

    const instance = L.map(element.current, {
      center: [20, 0],
      zoom: 2,
      scrollWheelZoom: false,
      // On touch screens a one-finger swipe should scroll the page instead
      // of dragging the map; the +/- buttons and pinch still zoom.
      dragging: !L.Browser.mobile,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    map.current = instance;

    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    marker.current?.remove();
    marker.current = null;

    if (place) {
      marker.current = L.circleMarker([place.lat, place.lng], {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor: "#dc2626",
        fillOpacity: 1,
      }).addTo(instance);
      instance.setView([place.lat, place.lng], place.kind === "region" ? 7 : 11);
    } else if (view?.bounds) {
      instance.fitBounds(view.bounds, { padding: [12, 12] });
    } else if (view) {
      instance.setView(view.center, 4);
    }
  }, [view, place]);

  return (
    <div className="relative z-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div
        ref={element}
        role="img"
        aria-label={
          place ? `Map showing ${place.label}` : "Map of the selected country"
        }
        className="h-56 w-full sm:h-64"
      />
    </div>
  );
}
