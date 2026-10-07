"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { SHOP_KIND_LABELS, type Shop } from "@/lib/shops/overpass";
import { KIND_COLORS } from "./kind-colors";

/**
 * The contents of a marker's popup. Built from DOM nodes with textContent,
 * never from an HTML string: shop names come from OpenStreetMap, which
 * anyone can edit, so they must be treated as plain text.
 */
function popup(shop: Shop): HTMLElement {
  const box = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = shop.name;
  const kind = document.createElement("div");
  kind.textContent = SHOP_KIND_LABELS[shop.kind];
  box.append(name, kind);
  if (shop.address) {
    const address = document.createElement("div");
    address.textContent = shop.address;
    box.append(address);
  }
  return box;
}

/**
 * Shops around a stop on an OpenStreetMap map. Leaflet needs the browser's
 * `window`, so load this component with `ssr: false`.
 */
export default function ShopMap({
  center,
  shops,
  selectedId,
  onSelect,
}: {
  center: { lat: number; lng: number };
  shops: Shop[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef(new Map<string, L.CircleMarker>());
  const select = useRef(onSelect);

  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!element.current) return;
    const instance = L.map(element.current, {
      scrollWheelZoom: false,
      // On touch screens a one-finger swipe should scroll the page.
      dragging: !L.Browser.mobile,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    map.current = instance;

    const created = markers.current;
    return () => {
      instance.remove();
      map.current = null;
      created.clear();
    };
  }, []);

  // Draw the markers and frame them together with the centre of the stop.
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    for (const marker of markers.current.values()) marker.remove();
    markers.current.clear();

    const points: L.LatLngTuple[] = [[center.lat, center.lng]];
    for (const shop of shops) {
      const marker = L.circleMarker([shop.lat, shop.lng], {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: KIND_COLORS[shop.kind],
        fillOpacity: 1,
      })
        .bindPopup(popup(shop))
        .on("click", () => select.current(shop.id))
        .addTo(instance);
      markers.current.set(shop.id, marker);
      points.push([shop.lat, shop.lng]);
    }

    if (points.length > 1) {
      instance.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 16 });
    } else {
      instance.setView([center.lat, center.lng], 13);
    }
  }, [center.lat, center.lng, shops]);

  // Open the popup of the shop chosen in the list.
  useEffect(() => {
    const instance = map.current;
    const marker = selectedId ? markers.current.get(selectedId) : null;
    if (!instance || !marker) return;
    instance.setView(marker.getLatLng(), Math.max(instance.getZoom(), 15));
    marker.openPopup();
  }, [selectedId]);

  return (
    <div className="relative z-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div
        ref={element}
        role="img"
        aria-label="Map of places selling souvenirs near this stop"
        className="h-72 w-full sm:h-80"
      />
    </div>
  );
}
