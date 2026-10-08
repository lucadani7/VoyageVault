"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState } from "react";
import { inputClass, labelClass, mutedClass, quietLinkClass } from "@/components/ui";
import type { CountryView, Place } from "@/lib/places";

const PlaceMap = dynamic(() => import("./place-map"), {
  ssr: false,
  loading: () => (
    <div className="h-56 w-full animate-pulse sm:h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
  ),
});

/**
 * Appears once a country is chosen: a search box that suggests cities and
 * regions of that country as you type, and a map that follows the choice.
 * A place is required, and free text is never accepted — it must be picked
 * from the list.
 */
export function PlacePicker({
  countryCode,
  defaultPlace,
}: {
  countryCode: string;
  defaultPlace: Place | null;
}) {
  const listId = useId();
  const [place, setPlace] = useState<Place | null>(defaultPlace);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">(
    "idle",
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [view, setView] = useState<CountryView | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // Point the map at the country.
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/places/country?code=${countryCode}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { view: null }))
      .then((data: { view: CountryView | null }) => setView(data.view))
      .catch(() => {});
    return () => controller.abort();
  }, [countryCode]);

  // Fetch suggestions shortly after the user stops typing.
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const response = await fetch(
          `/api/v1/places?country=${countryCode}&q=${encodeURIComponent(text)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as { places: Place[] };
        if (!response.ok) throw new Error("search failed");
        setSuggestions(data.places);
        setActive(0);
        setStatus(data.places.length ? "idle" : "empty");
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setStatus("error");
          setOpen(true);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, countryCode]);

  function choose(chosen: Place) {
    setPlace(chosen);
    setQuery("");
    setSuggestions([]);
    setStatus("idle");
    setOpen(false);
  }

  function clear() {
    setPlace(null);
    // Wait for the search box to be back on screen before focusing it.
    setTimeout(() => input.current?.focus());
  }

  function onType(text: string) {
    setQuery(text);
    if (text.trim().length < 2) {
      setSuggestions([]);
      setStatus("idle");
      setOpen(false);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || suggestions.length === 0) {
      // Enter must never submit the form with unchosen text in the box.
      if (event.key === "Enter" && query.trim()) event.preventDefault();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((active + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((active - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(suggestions[active]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="placeRef" value={place?.ref ?? ""} />
      <input type="hidden" name="placeKind" value={place?.kind ?? ""} />
      <input type="hidden" name="city" value={place?.city ?? ""} />
      <input type="hidden" name="region" value={place?.region ?? ""} />
      <input type="hidden" name="lat" value={place?.lat ?? ""} />
      <input type="hidden" name="lng" value={place?.lng ?? ""} />
      <input type="hidden" name="placeLabel" value={place?.label ?? ""} />

      <div className={labelClass}>
        <span>City or region</span>

        {place ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-300 py-0.5 pl-3 pr-2 dark:border-zinc-700">
            <span className="text-base font-normal">{place.label}</span>
            <button
              type="button"
              onClick={clear}
              className={quietLinkClass}
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              ref={input}
              name="placeQuery"
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-label="City or region"
              autoComplete="off"
              maxLength={100}
              placeholder="Start typing, then choose from the list"
              value={query}
              onChange={(event) => onType(event.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setOpen(suggestions.length > 0)}
              onBlur={() => setOpen(false)}
              className={`${inputClass} font-normal`}
            />
            {open && (
              <ul
                id={listId}
                role="listbox"
                className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 text-base font-normal shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
              >
                {suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.ref}
                    role="option"
                    aria-selected={index === active}
                    // Mouse down, not click: it fires before the input blurs.
                    onMouseDown={(event) => {
                      event.preventDefault();
                      choose(suggestion);
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 ${
                      index === active ? "bg-zinc-100 dark:bg-zinc-800" : ""
                    }`}
                  >
                    <span>{suggestion.label}</span>
                    <span className="text-xs text-zinc-500">
                      {suggestion.kind === "region" ? "Region" : "City"}
                    </span>
                  </li>
                ))}
                {status === "empty" && (
                  <li className={`px-3 py-2 ${mutedClass}`}>
                    No places found. Check the spelling or try a nearby city.
                  </li>
                )}
                {status === "error" && (
                  <li className={`px-3 py-2 ${mutedClass}`}>
                    Place search is unavailable right now. Try again shortly.
                  </li>
                )}
              </ul>
            )}
            {status === "loading" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-normal text-zinc-500">
                Searching…
              </span>
            )}
          </div>
        )}
      </div>

      <PlaceMap view={view} place={place} />
    </div>
  );
}
